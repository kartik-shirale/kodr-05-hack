import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { DEFAULT_RULES_CONFIG } from '../config/rules.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, nowInstant } from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const eventsRouter = Router();

// Teacher only for all event routes
eventsRouter.use(authenticate, requireRole('TEACHER'));

// ─── Validation Schemas ──────────────────────────────────────────────
const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid eventId UUID format'),
});

const reviewBodySchema = z.object({
  review: z.enum(['VALID', 'FALSE_ALARM', 'PENDING']),
});

// Helper: Verify teacher ownership for the event
async function getEventWithTeacherOwnership(eventId: string, teacherId: string) {
  const event = await db.orm.public.Event.where({ id: eventId }).first();
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }

  const session = await db.orm.public.ExamSession.where({ id: event.examSessionId }).first();
  if (!session) {
    throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
  }

  const participant = await db.orm.public.Participant.where({ id: session.participantId }).first();
  if (!participant) {
    throw new AppError(404, 'NOT_FOUND', 'Participant not found');
  }

  const test = await db.orm.public.Test.where({ id: participant.testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }

  return { event, session, participant, test };
}

// ─── 1. GET /events/:eventId/snapshot (Download Event Snapshot) ──────
eventsRouter.get(
  '/:eventId/snapshot',
  validate({ params: eventIdParamSchema }),
  async (req, res, next) => {
    try {
      const { eventId } = req.params as { eventId: string };
      const teacherId = req.user!.id;

      const { event } = await getEventWithTeacherOwnership(eventId, teacherId);

      if (!event.snapshotPath) {
        throw new AppError(404, 'NOT_FOUND', 'Snapshot not found');
      }

      const resolvedPath = path.isAbsolute(event.snapshotPath)
        ? event.snapshotPath
        : path.join(process.cwd(), event.snapshotPath);

      if (!fs.existsSync(resolvedPath)) {
        throw new AppError(404, 'NOT_FOUND', 'Snapshot file not found on disk');
      }

      const fileBytes = await fs.promises.readFile(resolvedPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', fileBytes.length);
      return res.status(200).send(fileBytes);
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. PATCH /events/:eventId/review (Review Event & Recalculate Risk) 
eventsRouter.patch(
  '/:eventId/review',
  validate({ params: eventIdParamSchema, body: reviewBodySchema }),
  async (req, res, next) => {
    try {
      const { eventId } = req.params as { eventId: string };
      const { review } = req.body as { review: 'VALID' | 'FALSE_ALARM' | 'PENDING' };
      const teacherId = req.user!.id;

      const { event, session, test } = await getEventWithTeacherOwnership(
        eventId,
        teacherId
      );

      const reviewedAt = review === 'PENDING' ? null : nowInstant();

      // Update event review status
      await db.orm.public.Event.where({ id: eventId }).update({
        review,
        reviewedAt,
      });

      // Load all events for this session to recompute risk
      const allSessionEvents = await db.orm.public.Event.where({
        examSessionId: session.id,
      }).all();

      // Recompute risk: events marked FALSE_ALARM are excluded
      const newRiskScore = allSessionEvents.reduce((acc, e) => {
        const effectiveReview = e.id === eventId ? review : e.review;
        if (effectiveReview === 'FALSE_ALARM') {
          return acc;
        }
        return acc + e.weight;
      }, 0);

      // Recompute risk level based on test rulesConfig levels
      const rulesConfig = (test.rulesConfig as any) || DEFAULT_RULES_CONFIG;
      const mediumThreshold =
        typeof rulesConfig.levels?.medium === 'number'
          ? rulesConfig.levels.medium
          : DEFAULT_RULES_CONFIG.levels.medium;
      const highThreshold =
        typeof rulesConfig.levels?.high === 'number'
          ? rulesConfig.levels.high
          : DEFAULT_RULES_CONFIG.levels.high;

      let newRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (newRiskScore >= highThreshold) {
        newRiskLevel = 'HIGH';
      } else if (newRiskScore >= mediumThreshold) {
        newRiskLevel = 'MEDIUM';
      }

      // Update session risk score and risk level
      await db.orm.public.ExamSession.where({ id: session.id }).update({
        riskScore: newRiskScore,
        riskLevel: newRiskLevel,
      });

      const updatedEvent = {
        id: event.id,
        type: event.type,
        occurredAt: event.occurredAt,
        durationMs: event.durationMs,
        weight: event.weight,
        countedAsWarning: event.countedAsWarning,
        warningNumber: event.warningNumber,
        review,
        reviewedAt: reviewedAt ? reviewedAt.toString() : null,
        hasSnapshot: !!event.snapshotPath,
        meta: event.meta,
      };

      res.status(200).json(
        formatSuccessResponse({
          event: updatedEvent,
          session: {
            riskScore: newRiskScore,
            riskLevel: newRiskLevel,
          },
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
