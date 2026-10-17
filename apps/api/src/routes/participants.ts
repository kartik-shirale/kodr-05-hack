import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config/env.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant, nowInstant } from '../prisma/db.js';
import { sendCredentialsEmail } from '../services/email.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';
import {
  generateRandomStudentPassword,
  generateStudentPassword,
} from '../utils/student-password.js';

export const participantsRouter = Router({ mergeParams: true });

// All participant routes require Teacher authentication
participantsRouter.use(authenticate, requireRole('TEACHER'));

// ─── Validation Schemas ──────────────────────────────────────────────
const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

const participantParamsSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
  participantId: z.string().uuid('Invalid participantId UUID format'),
});

const addParticipantsSchema = z.object({
  students: z
    .array(
      z.object({
        name: z.string().min(1, 'Student name is required'),
        email: z.string().email('Valid student email is required'),
      })
    )
    .min(1, 'At least 1 student is required')
    .max(500, 'Maximum 500 students per batch'),
});

const listParticipantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

// Helper: load test and verify ownership
async function getTeacherTest(testId: string, teacherId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  return test;
}

// ─── 1. POST /tests/:testId/participants (Add Participants) ─────────
participantsRouter.post(
  '/',
  validate({ params: testIdParamSchema, body: addParticipantsSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      await getTeacherTest(testId, teacherId);

      const { students } = req.body as { students: Array<{ name: string; email: string }> };

      // Fetch existing sets for round-robin assignment
      const sets = await db.orm.public.QuestionSet.where({ testId })
        .orderBy((s) => s.name.asc())
        .all();

      // Fetch existing participants to skip duplicates
      const existingParticipants = await db.orm.public.Participant.where({ testId }).all();
      const existingEmails = new Set(existingParticipants.map((p) => p.email.toLowerCase()));

      let created = 0;
      const skipped: Array<{ email: string; reason: string }> = [];

      for (const student of students) {
        const normalizedEmail = student.email.toLowerCase().trim();

        if (existingEmails.has(normalizedEmail)) {
          skipped.push({ email: student.email, reason: 'Duplicate email for this test' });
          continue;
        }

        existingEmails.add(normalizedEmail);

        // Deterministic plain password derivation and hashing
        const plainPassword = generateStudentPassword(testId, normalizedEmail);
        const passwordHash = await hashPassword(plainPassword);

        // Round-robin set assignment
        const assignedSet =
          sets.length > 0
            ? sets[(existingParticipants.length + created) % sets.length]
            : null;

        await db.orm.public.Participant.create({
          testId,
          setId: assignedSet ? assignedSet.id : null,
          name: student.name.trim(),
          email: normalizedEmail,
          passwordHash,
          failedLogins: 0,
          lockedUntil: null,
          lastLoginAt: null,
          credentialsSentAt: null,
          emailError: null,
        });

        created++;
      }

      res.status(201).json(
        formatSuccessResponse({
          created,
          skipped,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. GET /tests/:testId/participants (List Participants) ──────────
participantsRouter.get(
  '/',
  validate({ params: testIdParamSchema, query: listParticipantsQuerySchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      await getTeacherTest(testId, teacherId);

      const { page, limit, search } = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
      };

      // Load set mapping
      const sets = await db.orm.public.QuestionSet.where({ testId }).all();
      const setMap = new Map(sets.map((s) => [s.id, { id: s.id, name: s.name }]));

      let participants = await db.orm.public.Participant.where({ testId }).all();

      // Search filter by name or email
      if (search && search.trim()) {
        const searchLower = search.trim().toLowerCase();
        participants = participants.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower)
        );
      }

      // Sort alphabetically by student name
      participants.sort((a, b) => a.name.localeCompare(b.name));

      const total = participants.length;
      const offset = (page - 1) * limit;
      const paged = participants.slice(offset, offset + limit);

      const items = paged.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        set: p.setId && setMap.has(p.setId) ? setMap.get(p.setId)! : null,
        credentialsSentAt: p.credentialsSentAt,
        emailError: p.emailError,
      }));

      res.status(200).json(
        formatSuccessResponse(items, {
          page,
          limit,
          total,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 3. POST /tests/:testId/participants/send-credentials ────────────
participantsRouter.post(
  '/send-credentials',
  validate({ params: testIdParamSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      const test = await getTeacherTest(testId, teacherId);

      // Must be published
      if (test.status !== 'PUBLISHED') {
        throw new AppError(
          403,
          'TEST_NOT_PUBLISHED',
          'Test must be published before sending credentials'
        );
      }

      // Only send to participants whose credentialsSentAt is null
      const pendingParticipants = (
        await db.orm.public.Participant.where({ testId }).all()
      ).filter((p) => p.credentialsSentAt === null);

      let sent = 0;
      let failed = 0;

      for (const p of pendingParticipants) {
        const plainPassword = generateStudentPassword(testId, p.email);

        try {
          await sendCredentialsEmail({
            to: p.email,
            studentName: p.name,
            testTitle: test.title,
            startsAt: test.startsAt,
            durationMinutes: test.durationMinutes,
            password: plainPassword,
            joinUrl: `${config.frontendUrl}/join/${testId}`,
          });

          await db.orm.public.Participant.where({ id: p.id }).update({
            credentialsSentAt: nowInstant(),
            emailError: null,
          });

          sent++;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to send credentials';
          await db.orm.public.Participant.where({ id: p.id }).update({
            emailError: errorMessage,
          });
          failed++;
        }
      }

      res.status(202).json(
        formatSuccessResponse({
          sent,
          failed,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 4. DELETE /tests/:testId/participants/:participantId ────────────
participantsRouter.delete(
  '/:participantId',
  validate({ params: participantParamsSchema }),
  async (req, res, next) => {
    try {
      const { testId, participantId } = req.params as {
        testId: string;
        participantId: string;
      };
      const teacherId = req.user!.id;
      const test = await getTeacherTest(testId, teacherId);

      // Only before test starts
      const startMs = epochMsFromInstant(test.startsAt);
      if (Date.now() >= startMs) {
        throw new AppError(
          403,
          'TEST_STARTED',
          'Cannot delete participant after the test has started'
        );
      }

      const participant = await db.orm.public.Participant.where({
        id: participantId,
        testId,
      }).first();

      if (!participant) {
        throw new AppError(404, 'NOT_FOUND', 'Participant not found');
      }

      // Must have no exam session
      const session = await db.orm.public.ExamSession.where({ participantId }).first();
      if (session) {
        throw new AppError(
          409,
          'SESSION_EXISTS',
          'Cannot delete participant with an existing exam session'
        );
      }

      await db.orm.public.Participant.where({ id: participantId }).delete();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── 5. POST /tests/:testId/participants/:participantId/resend ───────
participantsRouter.post(
  '/:participantId/resend',
  validate({ params: participantParamsSchema }),
  async (req, res, next) => {
    try {
      const { testId, participantId } = req.params as {
        testId: string;
        participantId: string;
      };
      const teacherId = req.user!.id;
      const test = await getTeacherTest(testId, teacherId);

      const participant = await db.orm.public.Participant.where({
        id: participantId,
        testId,
      }).first();

      if (!participant) {
        throw new AppError(404, 'NOT_FOUND', 'Participant not found');
      }

      // Generate new password and hash
      const newPassword = generateRandomStudentPassword();
      const newPasswordHash = await hashPassword(newPassword);

      // Invalidate old session: revoke all refresh tokens of this participant
      await db.orm.public.RefreshToken.where({ participantId }).updateAll({
        revokedAt: nowInstant(),
      });

      try {
        await sendCredentialsEmail({
          to: participant.email,
          studentName: participant.name,
          testTitle: test.title,
          startsAt: test.startsAt,
          durationMinutes: test.durationMinutes,
          password: newPassword,
          joinUrl: `${config.frontendUrl}/join/${testId}`,
        });

        await db.orm.public.Participant.where({ id: participantId }).update({
          passwordHash: newPasswordHash,
          failedLogins: 0,
          lockedUntil: null,
          credentialsSentAt: nowInstant(),
          emailError: null,
        });

        res.status(200).json(
          formatSuccessResponse({
            message: 'Credentials resent successfully',
          })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Email dispatch failed';
        await db.orm.public.Participant.where({ id: participantId }).update({
          passwordHash: newPasswordHash,
          emailError: message,
        });

        throw new AppError(502, 'UPSTREAM_ERROR', 'Failed to dispatch email to student', {
          error: message,
        });
      }
    } catch (err) {
      next(err);
    }
  }
);
