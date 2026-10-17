import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant, instantFromMs, nowInstant } from '../prisma/db.js';
import {
  ingestProctoring,
  proctorUploadMiddleware,
  resolveRules,
} from '../services/proctoring.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const examRouter = Router();

examRouter.use(authenticate, requireRole('STUDENT'));

interface StudentContext {
  participant: {
    id: string;
    testId: string;
    setId: string | null;
    name: string;
    email: string;
  };
  test: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    startsAt: unknown;
    status: 'DRAFT' | 'PUBLISHED';
    warningsEnabled: boolean;
    maxWarnings: number;
    autoSubmitOnLimit: boolean;
    rulesConfig: unknown;
  };
  session: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';
    startedAt: unknown;
    endsAt: unknown;
    submittedAt: unknown;
    endReason: 'SUBMITTED_BY_STUDENT' | 'TIME_UP' | 'WARNING_LIMIT' | null;
    warningCount: number;
    score: number | null;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } | null;
}

function iso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : String(value);
}

async function loadStudentContext(studentId: string): Promise<StudentContext> {
  const participant = await db.orm.public.Participant.where({ id: studentId }).first();
  if (!participant) {
    throw new AppError(404, 'NOT_FOUND', 'Participant not found');
  }
  const test = await db.orm.public.Test.where({ id: participant.testId }).first();
  if (!test) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  const session = await db.orm.public.ExamSession.where({ participantId: studentId }).first();

  return {
    participant: {
      id: participant.id,
      testId: participant.testId,
      setId: participant.setId,
      name: participant.name,
      email: participant.email,
    },
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      durationMinutes: test.durationMinutes,
      startsAt: test.startsAt,
      status: test.status,
      warningsEnabled: test.warningsEnabled,
      maxWarnings: test.maxWarnings,
      autoSubmitOnLimit: test.autoSubmitOnLimit,
      rulesConfig: test.rulesConfig,
    },
    session: session
      ? {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          endsAt: session.endsAt,
          submittedAt: session.submittedAt,
          endReason: session.endReason,
          warningCount: session.warningCount,
          score: session.score,
          riskScore: session.riskScore,
          riskLevel: session.riskLevel,
        }
      : null,
  };
}

async function questionsForTest(testId: string, setId: string | null) {
  let targetSetId = setId;
  if (!targetSetId) {
    const sets = await db.orm.public.QuestionSet.where({ testId })
      .orderBy((set) => set.name.asc())
      .all();
    targetSetId = sets[0]?.id ?? null;
  }
  if (!targetSetId) return [];
  return db.orm.public.Question.where({ setId: targetSetId })
    .orderBy((question) => question.order.asc())
    .all();
}

async function finalizeSession(
  examSessionId: string,
  endReason: 'SUBMITTED_BY_STUDENT' | 'TIME_UP',
  questions: Array<{ id: string; correctIndex: number; marks: number }>
) {
  return db.transaction(async (tx) => {
    const locked = await tx.orm.public.ExamSession.where({ id: examSessionId })
      .forNoKeyUpdate()
      .first();
    if (!locked) {
      throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
    }
    if (locked.status !== 'IN_PROGRESS') {
      return {
        status: locked.status,
        submittedAt: locked.submittedAt,
        score: locked.score,
      };
    }

    const answers = await tx.orm.public.Answer.where({ examSessionId }).all();
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedIndex]));

    let score = 0;
    for (const question of questions) {
      if (answerMap.get(question.id) === question.correctIndex) {
        score += question.marks;
      }
    }

    const status = endReason === 'TIME_UP' ? 'AUTO_SUBMITTED' : 'SUBMITTED';
    const submittedAt = nowInstant();

    await tx.orm.public.ExamSession.where({ id: examSessionId }).update({
      status,
      endReason,
      submittedAt,
      score,
    });

    return { status, submittedAt, score };
  });
}

const consentBodySchema = z.object({
  accepted: z.literal(true),
});

const answerParamsSchema = z.object({
  questionId: z.string().uuid('Invalid questionId UUID format'),
});

const answerBodySchema = z.object({
  selectedIndex: z.number().int().min(0).nullable(),
});

// ─── 1. GET /exam/info ───────────────────────────────────────────────
examRouter.get('/info', async (req, res, next) => {
  try {
    const { participant, test, session } = await loadStudentContext(req.user!.id);
    const nowMs = Date.now();
    const startsAtMs = epochMsFromInstant(test.startsAt);
    const testEndMs = startsAtMs + test.durationMinutes * 60 * 1000;

    const canStart =
      test.status === 'PUBLISHED' &&
      nowMs >= startsAtMs &&
      nowMs < testEndMs &&
      (!session || session.status === 'IN_PROGRESS');

    res.status(200).json(
      formatSuccessResponse({
        test: {
          title: test.title,
          description: test.description ?? undefined,
          startsAt: iso(test.startsAt),
          durationMinutes: test.durationMinutes,
        },
        participant: { name: participant.name, email: participant.email },
        policy: {
          warningsEnabled: test.warningsEnabled,
          maxWarnings: test.maxWarnings,
          autoSubmitOnLimit: test.autoSubmitOnLimit,
        },
        serverTime: iso(nowInstant()),
        consentGiven: Boolean(session),
        sessionStatus: session ? session.status : null,
        canStart,
      })
    );
  } catch (error) {
    next(error);
  }
});

// ─── 2. POST /exam/consent ───────────────────────────────────────────
examRouter.post('/consent', validate({ body: consentBodySchema }), async (req, res, next) => {
  try {
    const studentId = req.user!.id;
    const { participant, test, session } = await loadStudentContext(studentId);
    const nowMs = Date.now();
    const startsAtMs = epochMsFromInstant(test.startsAt);
    const testEndMs = startsAtMs + test.durationMinutes * 60 * 1000;

    if (test.status !== 'PUBLISHED') {
      throw new AppError(403, 'TEST_NOT_PUBLISHED', 'Test is not published yet');
    }
    if (nowMs < startsAtMs) {
      throw new AppError(403, 'TEST_NOT_STARTED', 'The test has not started yet');
    }
    if (nowMs >= testEndMs) {
      throw new AppError(403, 'TEST_ENDED', 'The test window has closed');
    }

    if (session) {
      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, 'ALREADY_SUBMITTED', 'Exam already submitted');
      }
      res.status(200).json(formatSuccessResponse({ status: 'consented' }));
      return;
    }

    const durationMs = test.durationMinutes * 60 * 1000;
    const endsAtMs = Math.min(nowMs + durationMs, testEndMs);

    await db.orm.public.ExamSession.create({
      participantId: participant.id,
      consentAt: nowInstant(),
      startedAt: nowInstant(),
      endsAt: instantFromMs(endsAtMs),
      status: 'IN_PROGRESS',
      warningCount: 0,
      riskScore: 0,
      riskLevel: 'LOW',
    });

    res.status(200).json(formatSuccessResponse({ status: 'consented' }));
  } catch (error) {
    next(error);
  }
});

// ─── 3. POST /exam/start ─────────────────────────────────────────────
examRouter.post('/start', async (req, res, next) => {
  try {
    const { participant, test, session } = await loadStudentContext(req.user!.id);

    if (!session) {
      throw new AppError(409, 'CONSENT_REQUIRED', 'Consent is required before starting');
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError(409, 'ALREADY_SUBMITTED', 'Exam has already been submitted');
    }

    const questions = await questionsForTest(test.id, participant.setId);

    if (Date.now() >= epochMsFromInstant(session.endsAt)) {
      await finalizeSession(session.id, 'TIME_UP', questions);
      throw new AppError(409, 'ALREADY_SUBMITTED', 'Exam time has expired');
    }

    const answers = await db.orm.public.Answer.where({ examSessionId: session.id }).all();

    res.status(200).json(
      formatSuccessResponse({
        session: {
          id: session.id,
          endsAt: iso(session.endsAt),
          warningCount: session.warningCount,
        },
        serverTime: iso(nowInstant()),
        test: { title: test.title, durationMinutes: test.durationMinutes },
        policy: {
          warningsEnabled: test.warningsEnabled,
          maxWarnings: test.maxWarnings,
          autoSubmitOnLimit: test.autoSubmitOnLimit,
        },
        rules: test.rulesConfig,
        questions: questions.map((question) => ({
          id: question.id,
          text: question.text,
          options: question.options,
          marks: question.marks,
          order: question.order,
        })),
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
        })),
      })
    );
  } catch (error) {
    next(error);
  }
});

// ─── 4. GET /exam/status ─────────────────────────────────────────────
examRouter.get('/status', async (req, res, next) => {
  try {
    const { participant, test, session } = await loadStudentContext(req.user!.id);
    const startsAtMs = epochMsFromInstant(test.startsAt);
    const testEndMs = startsAtMs + test.durationMinutes * 60 * 1000;

    if (!session) {
      res.status(200).json(
        formatSuccessResponse({
          serverTime: iso(nowInstant()),
          endsAt: null,
          status: 'NOT_STARTED',
          warningCount: 0,
          answers: [],
        })
      );
      return;
    }

    let status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' = session.status;
    const endsAtMs = epochMsFromInstant(session.endsAt);

    if (status === 'IN_PROGRESS' && Date.now() >= endsAtMs) {
      const questions = await questionsForTest(test.id, participant.setId);
      const outcome = await finalizeSession(session.id, 'TIME_UP', questions);
      status = outcome.status as 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';
    }

    const answers = await db.orm.public.Answer.where({ examSessionId: session.id }).all();

    res.status(200).json(
      formatSuccessResponse({
        serverTime: iso(nowInstant()),
        endsAt: iso(session.endsAt) ?? iso(new Date(testEndMs)),
        status,
        warningCount: session.warningCount,
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
        })),
      })
    );
  } catch (error) {
    next(error);
  }
});

// ─── 5. PUT /exam/answers/:questionId ────────────────────────────────
examRouter.put(
  '/answers/:questionId',
  validate({ params: answerParamsSchema, body: answerBodySchema }),
  async (req, res, next) => {
    try {
      const { participant, test, session } = await loadStudentContext(req.user!.id);
      const { questionId } = req.params as { questionId: string };
      const { selectedIndex } = req.body as { selectedIndex: number | null };

      if (!session) {
        throw new AppError(409, 'CONSENT_REQUIRED', 'Exam has not started');
      }
      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, 'SESSION_ENDED', 'Exam session has ended');
      }
      if (Date.now() >= epochMsFromInstant(session.endsAt)) {
        const questions = await questionsForTest(test.id, participant.setId);
        await finalizeSession(session.id, 'TIME_UP', questions);
        throw new AppError(409, 'SESSION_ENDED', 'Exam time has expired');
      }

      const questions = await questionsForTest(test.id, participant.setId);
      const question = questions.find((item) => item.id === questionId);
      if (!question) {
        throw new AppError(404, 'NOT_FOUND', 'Question not found for this exam');
      }
      if (selectedIndex !== null && selectedIndex >= question.options.length) {
        throw new AppError(400, 'VALIDATION_ERROR', 'selectedIndex is out of range');
      }

      const existing = await db.orm.public.Answer.where({
        examSessionId: session.id,
        questionId,
      }).first();

      if (selectedIndex === null) {
        if (existing) {
          await db.orm.public.Answer.where({ id: existing.id }).delete();
        }
      } else if (existing) {
        await db.orm.public.Answer.where({ id: existing.id }).update({ selectedIndex });
      } else {
        await db.orm.public.Answer.create({
          examSessionId: session.id,
          questionId,
          selectedIndex,
        });
      }

      res.status(200).json(
        formatSuccessResponse({
          questionId,
          selectedIndex,
          savedAt: iso(nowInstant()),
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

// ─── 6. POST /exam/events ────────────────────────────────────────────
examRouter.post('/events', proctorUploadMiddleware, async (req, res, next) => {
  try {
    const { participant, test, session } = await loadStudentContext(req.user!.id);

    if (!session) {
      throw new AppError(409, 'CONSENT_REQUIRED', 'Exam has not started');
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError(409, 'SESSION_ENDED', 'Exam session has ended');
    }
    if (Date.now() >= epochMsFromInstant(session.endsAt)) {
      const questions = await questionsForTest(test.id, participant.setId);
      await finalizeSession(session.id, 'TIME_UP', questions);
      throw new AppError(409, 'SESSION_ENDED', 'Exam time has expired');
    }

    const rules = resolveRules(test.rulesConfig);
    const result = await ingestProctoring({
      req,
      examSessionId: session.id,
      rules,
      policy: {
        warningsEnabled: test.warningsEnabled,
        maxWarnings: test.maxWarnings,
        autoSubmitOnLimit: test.autoSubmitOnLimit,
      },
    });

    const warning =
      result.warning.counted || result.warning.terminated
        ? {
            counted: result.warning.counted,
            number: result.warning.number ?? result.warning.count,
            max: result.warning.max,
            remaining: result.warning.remaining,
            terminated: result.warning.terminated,
          }
        : null;

    res.status(200).json(
      formatSuccessResponse({
        eventId: result.events[0]?.id ?? null,
        warning,
      })
    );
  } catch (error) {
    next(error);
  }
});

// ─── 7. POST /exam/submit ────────────────────────────────────────────
examRouter.post('/submit', async (req, res, next) => {
  try {
    const { participant, test, session } = await loadStudentContext(req.user!.id);

    if (!session) {
      throw new AppError(409, 'CONSENT_REQUIRED', 'Exam has not started');
    }

    const questions = await questionsForTest(test.id, participant.setId);
    const outcome = await finalizeSession(session.id, 'SUBMITTED_BY_STUDENT', questions);

    res.status(200).json(
      formatSuccessResponse({
        status: outcome.status,
        submittedAt: iso(outcome.submittedAt) ?? iso(nowInstant()),
        score: outcome.score,
      })
    );
  } catch (error) {
    next(error);
  }
});
