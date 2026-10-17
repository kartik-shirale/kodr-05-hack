import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db } from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const sessionsRouter = Router();

sessionsRouter.use(authenticate, requireRole('TEACHER'));

// ─── Validation Schemas ──────────────────────────────────────────────
const examSessionIdParamSchema = z.object({
  examSessionId: z.string().uuid('Invalid examSessionId UUID format'),
});

const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

export const listSessionsQuerySchema = z.object({
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED'])
    .optional(),
  sort: z.enum(['risk:desc', 'name:asc', 'score:desc']).default('risk:desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Helper: Get Test for Teacher ────────────────────────────────────
async function getTeacherTest(testId: string, teacherId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  return test;
}

// ─── 1. GET /tests/:testId/sessions (List Sessions for Test) ─────────
export async function handleListTestSessions(req: any, res: any, next: any) {
  try {
    const { testId } = req.params as { testId: string };
    const teacherId = req.user!.id;
    await getTeacherTest(testId, teacherId);

    const { risk, status, sort, page, limit } = req.query as {
      risk?: 'LOW' | 'MEDIUM' | 'HIGH';
      status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';
      sort: 'risk:desc' | 'name:asc' | 'score:desc';
      page: number;
      limit: number;
    };

    // Load all participants for this test
    const participants = await db.orm.public.Participant.where({ testId }).all();

    // Load exam sessions for these participants in parallel
    const sessionResults = await Promise.all(
      participants.map((p) => db.orm.public.ExamSession.where({ participantId: p.id }).first())
    );
    const testSessions = sessionResults.filter(
      (s): s is NonNullable<typeof s> => !!s
    );
    const sessionByParticipant = new Map(testSessions.map((s) => [s.participantId, s]));

    // Load events for these sessions in parallel
    const eventResults = await Promise.all(
      testSessions.map((s) => db.orm.public.Event.where({ examSessionId: s.id }).all())
    );
    const eventsBySession = new Map<string, (typeof eventResults)[number]>();
    testSessions.forEach((s, idx) => {
      eventsBySession.set(s.id, eventResults[idx] ?? []);
    });

    // Build row per participant
    let rows = participants.map((p) => {
      const session = sessionByParticipant.get(p.id);

      if (session) {
        const sessionEvents = eventsBySession.get(session.id) ?? [];
        const totalEvents = sessionEvents.length;
        const pendingEvents = sessionEvents.filter((e) => e.review === 'PENDING').length;
        const validEvents = sessionEvents.filter((e) => e.review === 'VALID').length;
        const falseAlarmEvents = sessionEvents.filter((e) => e.review === 'FALSE_ALARM').length;

        return {
          participantId: p.id,
          name: p.name,
          email: p.email,
          examSessionId: session.id,
          status: session.status as 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED',
          endReason: session.endReason,
          score: session.score,
          riskLevel: session.riskLevel,
          riskScore: session.riskScore,
          warningCount: session.warningCount,
          events: {
            total: totalEvents,
            pending: pendingEvents,
            valid: validEvents,
            falseAlarm: falseAlarmEvents,
          },
        };
      }

      // Participant has not started yet
      return {
        participantId: p.id,
        name: p.name,
        email: p.email,
        examSessionId: null,
        status: 'NOT_STARTED' as const,
        endReason: null,
        score: null,
        riskLevel: null,
        riskScore: null,
        warningCount: null,
        events: {
          total: 0,
          pending: 0,
          valid: 0,
          falseAlarm: 0,
        },
      };
    });

    // Filter by status
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }

    // Filter by risk
    if (risk) {
      rows = rows.filter((r) => r.riskLevel === risk);
    }

    // Sort rows
    const riskRank = (level: string | null) => {
      if (level === 'HIGH') return 3;
      if (level === 'MEDIUM') return 2;
      if (level === 'LOW') return 1;
      return 0;
    };

    if (sort === 'risk:desc') {
      rows.sort((a, b) => {
        const diffRank = riskRank(b.riskLevel) - riskRank(a.riskLevel);
        if (diffRank !== 0) return diffRank;
        const diffScore = (b.riskScore ?? 0) - (a.riskScore ?? 0);
        if (diffScore !== 0) return diffScore;
        return a.name.localeCompare(b.name);
      });
    } else if (sort === 'name:asc') {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'score:desc') {
      rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    }

    const total = rows.length;
    const offset = (page - 1) * limit;
    const paged = rows.slice(offset, offset + limit);

    res.status(200).json(
      formatSuccessResponse(paged, {
        page,
        limit,
        total,
      })
    );
  } catch (err) {
    next(err);
  }
}

// ─── 2. GET /sessions/:examSessionId (Single Session Details) ────────
sessionsRouter.get(
  '/:examSessionId',
  validate({ params: examSessionIdParamSchema }),
  async (req, res, next) => {
    try {
      const { examSessionId } = req.params as { examSessionId: string };
      const teacherId = req.user!.id;

      const session = await db.orm.public.ExamSession.where({
        id: examSessionId,
      }).first();
      if (!session) {
        throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
      }

      const participant = await db.orm.public.Participant.where({
        id: session.participantId,
      }).first();
      if (!participant) {
        throw new AppError(404, 'NOT_FOUND', 'Participant not found');
      }

      // Verify test belongs to this teacher
      await getTeacherTest(participant.testId, teacherId);

      // Load participant set
      const set = participant.setId
        ? await db.orm.public.QuestionSet.where({ id: participant.setId }).first()
        : null;

      // Load events ordered by occurredAt ascending
      const events = await db.orm.public.Event.where({ examSessionId })
        .orderBy((e) => e.occurredAt.asc())
        .all();

      // Load student answers and match with question.correctIndex
      const answers = await db.orm.public.Answer.where({ examSessionId }).all();
      const questionIds = answers.map((a) => a.questionId);
      const questions = await Promise.all(
        questionIds.map((id) => db.orm.public.Question.where({ id }).first())
      );
      const questionMap = new Map(
        questions.filter((q): q is NonNullable<typeof q> => !!q).map((q) => [q.id, q])
      );

      const formattedAnswers = answers.map((a) => {
        const question = questionMap.get(a.questionId);
        return {
          questionId: a.questionId,
          selectedIndex: a.selectedIndex,
          correct: question ? a.selectedIndex === question.correctIndex : false,
        };
      });

      const formattedEvents = events.map((e) => ({
        id: e.id,
        type: e.type,
        occurredAt: e.occurredAt,
        durationMs: e.durationMs,
        weight: e.weight,
        countedAsWarning: e.countedAsWarning,
        warningNumber: e.warningNumber,
        review: e.review,
        hasSnapshot: !!e.snapshotPath,
        meta: e.meta,
      }));

      res.status(200).json(
        formatSuccessResponse({
          session: {
            id: session.id,
            status: session.status,
            endReason: session.endReason,
            startedAt: session.startedAt,
            endsAt: session.endsAt,
            submittedAt: session.submittedAt,
            warningCount: session.warningCount,
            score: session.score,
            riskScore: session.riskScore,
            riskLevel: session.riskLevel,
          },
          participant: {
            name: participant.name,
            email: participant.email,
            set: set ? { id: set.id, name: set.name } : null,
          },
          events: formattedEvents,
          answers: formattedAnswers,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
