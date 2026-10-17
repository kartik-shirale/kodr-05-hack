import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, nowInstant } from '../prisma/db.js';
import { resolveRules, riskLevelFor } from '../services/proctoring.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

type EventType = 'NO_FACE' | 'MULTIPLE_FACES' | 'LOOKING_AWAY' | 'PHONE_DETECTED' | 'TAB_SWITCH';
type ReviewStatus = 'PENDING' | 'VALID' | 'FALSE_ALARM';
type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

interface EventRow {
  id: string;
  type: EventType;
  occurredAt: unknown;
  durationMs: number | null;
  weight: number;
  countedAsWarning: boolean;
  warningNumber: number | null;
  review: ReviewStatus;
  snapshotPath: string | null;
  meta: unknown;
}

function iso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : String(value);
}

function toEventItem(event: EventRow) {
  const isDataUrl =
    typeof event.snapshotPath === 'string' && event.snapshotPath.startsWith('data:image/');
  return {
    id: event.id,
    type: event.type,
    occurredAt: iso(event.occurredAt),
    durationMs: event.durationMs ?? undefined,
    weight: event.weight,
    countedAsWarning: event.countedAsWarning,
    warningNumber: event.warningNumber ?? undefined,
    review: event.review,
    hasSnapshot: Boolean(event.snapshotPath),
    snapshotDataUrl: isDataUrl ? event.snapshotPath : undefined,
    meta: (event.meta ?? undefined) as Record<string, unknown> | undefined,
  };
}

function mapEndReason(endReason: string | null): 'NORMAL' | 'TIME_UP' | 'WARNING_LIMIT' | undefined {
  if (endReason === 'SUBMITTED_BY_STUDENT') return 'NORMAL';
  if (endReason === 'TIME_UP') return 'TIME_UP';
  if (endReason === 'WARNING_LIMIT') return 'WARNING_LIMIT';
  return undefined;
}

async function getTeacherTest(testId: string, teacherId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  return test;
}

// ═══════════════════════════════════════════════════════════════════════
// Teacher: test session listing  →  /tests/:testId/sessions
// ═══════════════════════════════════════════════════════════════════════
export const testSessionsRouter = Router({ mergeParams: true });

testSessionsRouter.use(authenticate, requireRole('TEACHER'));

const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

const sessionsQuerySchema = z.object({
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED']).optional(),
  sort: z.enum(['risk:desc', 'name:asc', 'score:desc']).default('risk:desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

testSessionsRouter.get(
  '/',
  validate({ params: testIdParamSchema, query: sessionsQuerySchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      await getTeacherTest(testId, teacherId);

      const { risk, status, sort, page, limit } = req.query as unknown as {
        risk?: 'LOW' | 'MEDIUM' | 'HIGH';
        status?: SessionStatus;
        sort: 'risk:desc' | 'name:asc' | 'score:desc';
        page: number;
        limit: number;
      };

      const participants = await db.orm.public.Participant.where({ testId }).all();

      const rows = await Promise.all(
        participants.map(async (participant) => {
          const session = await db.orm.public.ExamSession.where({
            participantId: participant.id,
          }).first();

          if (!session) {
            return {
              participantId: participant.id,
              name: participant.name,
              email: participant.email,
              status: 'NOT_STARTED' as const,
              events: { total: 0, pending: 0, valid: 0, falseAlarm: 0 },
              _riskScore: -1,
              _score: -1,
            };
          }

          const events = await db.orm.public.Event.where({
            examSessionId: session.id,
          }).all();

          const stats = { total: events.length, pending: 0, valid: 0, falseAlarm: 0 };
          for (const event of events) {
            if (event.review === 'PENDING') stats.pending += 1;
            else if (event.review === 'VALID') stats.valid += 1;
            else stats.falseAlarm += 1;
          }

          return {
            participantId: participant.id,
            name: participant.name,
            email: participant.email,
            examSessionId: session.id,
            status: session.status as SessionStatus,
            endReason: mapEndReason(session.endReason),
            score: session.score ?? undefined,
            riskLevel: session.riskLevel,
            riskScore: session.riskScore,
            warningCount: session.warningCount,
            events: stats,
            _riskScore: session.riskScore,
            _score: session.score ?? -1,
          };
        })
      );

      let filtered = rows;
      if (risk) filtered = filtered.filter((row) => row.riskLevel === risk);
      if (status) filtered = filtered.filter((row) => row.status === status);

      filtered.sort((a, b) => {
        if (sort === 'name:asc') return a.name.localeCompare(b.name);
        if (sort === 'score:desc') return b._score - a._score;
        return b._riskScore - a._riskScore;
      });

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paged = filtered.slice(offset, offset + limit).map(({ _riskScore, _score, ...row }) => row);

      res.status(200).json(formatSuccessResponse(paged, { page, limit, total }));
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// Teacher: session detail + event review  →  /sessions/:examSessionId, /events/:eventId
// ═══════════════════════════════════════════════════════════════════════
export const sessionReviewRouter = Router();

const teacherGuard = [authenticate, requireRole('TEACHER')] as const;

const sessionIdParamSchema = z.object({
  examSessionId: z.string().uuid('Invalid examSessionId UUID format'),
});

const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid eventId UUID format'),
});

const reviewBodySchema = z.object({
  review: z.enum(['VALID', 'FALSE_ALARM', 'PENDING']),
});

async function loadOwnedSession(examSessionId: string, teacherId: string) {
  const session = await db.orm.public.ExamSession.where({ id: examSessionId }).first();
  if (!session) {
    throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
  }
  const participant = await db.orm.public.Participant.where({ id: session.participantId }).first();
  if (!participant) {
    throw new AppError(404, 'NOT_FOUND', 'Participant not found');
  }
  const test = await db.orm.public.Test.where({ id: participant.testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this session');
  }
  return { session, participant, test };
}

sessionReviewRouter.get(
  '/sessions/:examSessionId',
  ...teacherGuard,
  validate({ params: sessionIdParamSchema }),
  async (req, res, next) => {
    try {
      const { examSessionId } = req.params as { examSessionId: string };
      const { session, participant, test } = await loadOwnedSession(
        examSessionId,
        req.user!.id
      );

      let set: { id: string; name: string } | null = null;
      if (participant.setId) {
        const questionSet = await db.orm.public.QuestionSet.where({
          id: participant.setId,
        }).first();
        if (questionSet) set = { id: questionSet.id, name: questionSet.name };
      }

      const eventRows = await db.orm.public.Event.where({
        examSessionId,
      })
        .orderBy((event) => event.occurredAt.asc())
        .all();

      const questionRows = participant.setId
        ? await db.orm.public.Question.where({ setId: participant.setId }).all()
        : [];
      const questionMap = new Map(questionRows.map((q) => [q.id, q]));

      const answerRows = await db.orm.public.Answer.where({ examSessionId }).all();

      res.status(200).json(
        formatSuccessResponse({
          session: {
            id: session.id,
            status: session.status,
            endReason: mapEndReason(session.endReason),
            startedAt: iso(session.startedAt),
            endsAt: iso(session.endsAt),
            submittedAt: iso(session.submittedAt) ?? undefined,
            warningCount: session.warningCount,
            score: session.score ?? undefined,
            riskScore: session.riskScore,
            riskLevel: session.riskLevel,
          },
          participant: {
            name: participant.name,
            email: participant.email,
            set: set ?? { id: '', name: 'Unassigned' },
          },
          events: eventRows.map((event) => toEventItem(event as unknown as EventRow)),
          answers: answerRows.map((answer) => {
            const question = questionMap.get(answer.questionId);
            return {
              questionId: answer.questionId,
              selectedIndex: answer.selectedIndex,
              correct: question ? answer.selectedIndex === question.correctIndex : undefined,
            };
          }),
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

sessionReviewRouter.patch(
  '/events/:eventId/review',
  ...teacherGuard,
  validate({ params: eventIdParamSchema, body: reviewBodySchema }),
  async (req, res, next) => {
    try {
      const { eventId } = req.params as { eventId: string };
      const { review } = req.body as { review: ReviewStatus };
      const teacherId = req.user!.id;

      const event = await db.orm.public.Event.where({ id: eventId }).first();
      if (!event) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      const { session, test } = await loadOwnedSession(event.examSessionId, teacherId);

      const updated = await db.orm.public.Event.where({ id: eventId }).update({
        review,
        reviewedAt: nowInstant(),
      });

      const allEvents = await db.orm.public.Event.where({
        examSessionId: session.id,
      }).all();
      const rules = resolveRules(test.rulesConfig);
      const riskScore = allEvents
        .filter((row) => row.review !== 'FALSE_ALARM')
        .reduce((sum, row) => sum + row.weight, 0);
      const riskLevel = riskLevelFor(riskScore, rules);

      await db.orm.public.ExamSession.where({ id: session.id }).update({
        riskScore,
        riskLevel,
      });

      res.status(200).json(
        formatSuccessResponse({
          event: toEventItem((updated ?? event) as unknown as EventRow),
          session: { riskScore, riskLevel },
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

sessionReviewRouter.get(
  '/events/:eventId/snapshot',
  ...teacherGuard,
  validate({ params: eventIdParamSchema }),
  async (req, res, next) => {
    try {
      const { eventId } = req.params as { eventId: string };
      const event = await db.orm.public.Event.where({ id: eventId }).first();
      if (!event) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }
      await loadOwnedSession(event.examSessionId, req.user!.id);

      if (!event.snapshotPath) {
        throw new AppError(404, 'NOT_FOUND', 'No snapshot for this event');
      }

      if (event.snapshotPath.startsWith('data:image/')) {
        const matches = event.snapshotPath.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/jpeg';
        const base64Data = matches ? matches[2] : event.snapshotPath.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        return res.end(buffer);
      }

      const absolute = path.resolve(process.cwd(), event.snapshotPath);
      res.sendFile(absolute, (error) => {
        if (error) next(new AppError(404, 'NOT_FOUND', 'Snapshot file is missing'));
      });
    } catch (err) {
      next(err);
    }
  }
);
