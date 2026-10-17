import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { DEFAULT_RULES_CONFIG } from '../config/rules.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  db,
  epochMsFromInstant,
  instantFromDate,
  instantFromMs,
  nowInstant,
  Temporal,
} from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const examRouter = Router();

// All student routes require role STUDENT
examRouter.use(authenticate, requireRole('STUDENT'));

// In-memory lobby consent tracking before exam start
export const pendingConsents = new Map<string, Temporal.Instant>();

// Multer memory storage configuration for snapshots (max 50 KB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 }, // 50 KB max
});

// Middleware to handle both multipart form data and application/json
function handleMultipartOrJson(req: any, res: any, next: any) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('snapshot')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(400, 'VALIDATION_ERROR', 'Snapshot must be at most 50 KB')
          );
        }
        return next(err);
      }
      next();
    });
  } else {
    next();
  }
}

// ─── Helper Functions ────────────────────────────────────────────────
async function getStudentContext(participantId: string) {
  const participant = await db.orm.public.Participant.where({
    id: participantId,
  }).first();

  if (!participant) {
    throw new AppError(404, 'NOT_FOUND', 'Participant not found');
  }

  const test = await db.orm.public.Test.where({ id: participant.testId }).first();
  if (!test) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }

  return { participant, test };
}

function extractClientRules(rulesConfig: any) {
  const cfg = rulesConfig || DEFAULT_RULES_CONFIG;
  return {
    warningCooldownSec: cfg.warningCooldownSec ?? 15,
    NO_FACE: {
      enabled: cfg.NO_FACE?.enabled ?? true,
      afterSec: cfg.NO_FACE?.afterSec ?? 3,
    },
    MULTIPLE_FACES: {
      enabled: cfg.MULTIPLE_FACES?.enabled ?? true,
      afterSec: cfg.MULTIPLE_FACES?.afterSec ?? 2,
    },
    LOOKING_AWAY: {
      enabled: cfg.LOOKING_AWAY?.enabled ?? true,
      afterSec: cfg.LOOKING_AWAY?.afterSec ?? 5,
      yawDeg: cfg.LOOKING_AWAY?.yawDeg ?? 35,
      ignoreLookingDown: cfg.LOOKING_AWAY?.ignoreLookingDown ?? true,
    },
    PHONE_DETECTED: {
      enabled: cfg.PHONE_DETECTED?.enabled ?? true,
      minConfidence: cfg.PHONE_DETECTED?.minConfidence ?? 0.6,
      afterSec: cfg.PHONE_DETECTED?.afterSec ?? 2,
    },
    TAB_SWITCH: {
      enabled: cfg.TAB_SWITCH?.enabled ?? true,
    },
  };
}

// ─── 1. GET /exam/info ───────────────────────────────────────────────
examRouter.get('/info', async (req, res, next) => {
  try {
    const { participant, test } = await getStudentContext(req.user!.id);

    const startsAtMs = epochMsFromInstant(test.startsAt);
    const durationMs = test.durationMinutes * 60 * 1000;
    const testEndMs = startsAtMs + durationMs;
    const nowMs = Date.now();

    const existingSession = await db.orm.public.ExamSession.where({
      participantId: participant.id,
    }).first();

    const consentGiven = !!existingSession || pendingConsents.has(participant.id);
    const sessionStatus = existingSession ? existingSession.status : null;

    const canStart =
      consentGiven &&
      startsAtMs <= nowMs &&
      nowMs < testEndMs &&
      (!existingSession || existingSession.status === 'IN_PROGRESS');

    res.status(200).json(
      formatSuccessResponse({
        test: {
          title: test.title,
          description: test.description,
          startsAt: test.startsAt,
          durationMinutes: test.durationMinutes,
        },
        participant: {
          name: participant.name,
          email: participant.email,
        },
        policy: {
          warningsEnabled: test.warningsEnabled,
          maxWarnings: test.maxWarnings,
          autoSubmitOnLimit: test.autoSubmitOnLimit,
        },
        serverTime: new Date(nowMs).toISOString(),
        consentGiven,
        sessionStatus,
        canStart,
      })
    );
  } catch (err) {
    next(err);
  }
});

// ─── 2. POST /exam/consent ───────────────────────────────────────────
const consentBodySchema = z.object({
  accepted: z.literal(true, {
    message: 'accepted must be true to record consent',
  }),
});

examRouter.post(
  '/consent',
  validate({ body: consentBodySchema }),
  async (req, res, next) => {
    try {
      const { participant } = await getStudentContext(req.user!.id);

      const existingSession = await db.orm.public.ExamSession.where({
        participantId: participant.id,
      }).first();

      const consentTime = existingSession?.consentAt ?? nowInstant();
      if (!existingSession) {
        pendingConsents.set(participant.id, consentTime);
      }

      res.status(200).json(
        formatSuccessResponse({
          accepted: true,
          consentAt: consentTime.toString(),
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 3. POST /exam/start ─────────────────────────────────────────────
examRouter.post('/start', async (req, res, next) => {
  try {
    const { participant, test } = await getStudentContext(req.user!.id);

    const startsAtMs = epochMsFromInstant(test.startsAt);
    const durationMs = test.durationMinutes * 60 * 1000;
    const testEndMs = startsAtMs + durationMs;
    const nowMs = Date.now();

    let session = await db.orm.public.ExamSession.where({
      participantId: participant.id,
    }).first();

    if (session) {
      // If already finalized, error 409
      if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
        throw new AppError(
          409,
          'ALREADY_SUBMITTED',
          'Exam has already been submitted'
        );
      }
    } else {
      // 1. Consent required check
      if (!pendingConsents.has(participant.id)) {
        throw new AppError(
          403,
          'CONSENT_REQUIRED',
          'Consent is required before starting the exam'
        );
      }

      // 2. Test not started check
      if (startsAtMs > nowMs) {
        throw new AppError(403, 'TEST_NOT_STARTED', 'Test has not started yet');
      }

      // 3. Test ended check
      if (nowMs >= testEndMs) {
        throw new AppError(403, 'TEST_ENDED', 'Test has already ended');
      }

      const sessionEndMs = Math.min(nowMs + durationMs, testEndMs);
      const consentAt = pendingConsents.get(participant.id) ?? nowInstant();
      pendingConsents.delete(participant.id);

      session = await db.orm.public.ExamSession.create({
        participantId: participant.id,
        consentAt,
        startedAt: nowInstant(),
        endsAt: instantFromMs(sessionEndMs),
        status: 'IN_PROGRESS',
        warningCount: 0,
        riskScore: 0,
        riskLevel: 'LOW',
      });
    }

    // Ensure student has a set assigned
    let setId = participant.setId;
    if (!setId) {
      const firstSet = await db.orm.public.QuestionSet.where({
        testId: test.id,
      }).first();
      if (firstSet) {
        setId = firstSet.id;
        await db.orm.public.Participant.where({ id: participant.id }).update({
          setId,
        });
      }
    }

    // Load questions without correctIndex
    const questions = setId
      ? await db.orm.public.Question.where({ setId })
          .orderBy((q) => q.order.asc())
          .all()
      : [];

    const answers = await db.orm.public.Answer.where({
      examSessionId: session.id,
    }).all();

    res.status(200).json(
      formatSuccessResponse({
        session: {
          id: session.id,
          endsAt: session.endsAt,
          warningCount: session.warningCount,
        },
        serverTime: new Date(nowMs).toISOString(),
        test: {
          title: test.title,
          durationMinutes: test.durationMinutes,
        },
        policy: {
          warningsEnabled: test.warningsEnabled,
          maxWarnings: test.maxWarnings,
          autoSubmitOnLimit: test.autoSubmitOnLimit,
        },
        rules: extractClientRules(test.rulesConfig),
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          marks: q.marks,
          order: q.order,
        })),
        answers: answers.map((a) => ({
          questionId: a.questionId,
          selectedIndex: a.selectedIndex,
        })),
      })
    );
  } catch (err) {
    next(err);
  }
});

// ─── 4. GET /exam/status ─────────────────────────────────────────────
examRouter.get('/status', async (req, res, next) => {
  try {
    const { participant } = await getStudentContext(req.user!.id);
    const session = await db.orm.public.ExamSession.where({
      participantId: participant.id,
    }).first();

    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
    }

    const answers = await db.orm.public.Answer.where({
      examSessionId: session.id,
    }).all();

    res.status(200).json(
      formatSuccessResponse({
        serverTime: new Date().toISOString(),
        endsAt: session.endsAt,
        status: session.status,
        warningCount: session.warningCount,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          selectedIndex: a.selectedIndex,
        })),
      })
    );
  } catch (err) {
    next(err);
  }
});

// ─── 5. PUT /exam/answers/:questionId ────────────────────────────────
const answerParamSchema = z.object({
  questionId: z.string().uuid('Invalid questionId UUID format'),
});

const answerBodySchema = z.object({
  selectedIndex: z.number().int().min(0, 'selectedIndex must be non-negative'),
});

examRouter.put(
  '/answers/:questionId',
  validate({ params: answerParamSchema, body: answerBodySchema }),
  async (req, res, next) => {
    try {
      const { questionId } = req.params as { questionId: string };
      const { selectedIndex } = req.body as { selectedIndex: number };
      const { participant } = await getStudentContext(req.user!.id);

      const session = await db.orm.public.ExamSession.where({
        participantId: participant.id,
      }).first();

      if (!session) {
        throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, 'SESSION_ENDED', 'Exam session has already ended');
      }

      // Check session endsAt + 5s grace period
      const endsAtMs = epochMsFromInstant(session.endsAt);
      if (Date.now() > endsAtMs + 5000) {
        throw new AppError(
          409,
          'SESSION_ENDED',
          'Exam session has ended (time limit expired)'
        );
      }

      // Validate question belongs to student's set
      const question = await db.orm.public.Question.where({ id: questionId }).first();
      if (!question || question.setId !== participant.setId) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Question is not part of student assigned set'
        );
      }

      if (selectedIndex >= question.options.length) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'selectedIndex is out of bounds for the question options'
        );
      }

      // Upsert answer
      const existingAnswer = await db.orm.public.Answer.where({
        examSessionId: session.id,
        questionId,
      }).first();

      if (existingAnswer) {
        await db.orm.public.Answer.where({ id: existingAnswer.id }).update({
          selectedIndex,
        });
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
          savedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 6. POST /exam/events ────────────────────────────────────────────
const eventTypeSchema = z.enum([
  'NO_FACE',
  'MULTIPLE_FACES',
  'LOOKING_AWAY',
  'PHONE_DETECTED',
  'TAB_SWITCH',
]);

examRouter.post(
  '/events',
  handleMultipartOrJson,
  async (req, res, next) => {
    try {
      const { participant, test } = await getStudentContext(req.user!.id);
      const session = await db.orm.public.ExamSession.where({
        participantId: participant.id,
      }).first();

      if (!session) {
        throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
      }

      const endsAtMs = epochMsFromInstant(session.endsAt);
      const nowMs = Date.now();

      // Rule 1: Session must be IN_PROGRESS and before endsAt
      if (session.status !== 'IN_PROGRESS' || nowMs > endsAtMs) {
        throw new AppError(409, 'SESSION_ENDED', 'Exam session has ended');
      }

      // Parse fields
      const typeResult = eventTypeSchema.safeParse(req.body.type);
      if (!typeResult.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          `Invalid event type: ${req.body.type}`
        );
      }
      const type = typeResult.data;

      const occurredAt = req.body.occurredAt
        ? instantFromDate(new Date(req.body.occurredAt))
        : nowInstant();

      let parsedMeta: any = null;
      if (req.body.meta) {
        try {
          parsedMeta =
            typeof req.body.meta === 'string'
              ? JSON.parse(req.body.meta)
              : req.body.meta;
        } catch (_e) {
          parsedMeta = null;
        }
      }

      const durationMs = req.body.durationMs
        ? parseInt(String(req.body.durationMs), 10)
        : null;

      // Rule 2: Look up rule in rulesConfig. If disabled, store nothing.
      const rulesConfig = (test.rulesConfig as any) || DEFAULT_RULES_CONFIG;
      const rule = rulesConfig[type];

      if (!rule || rule.enabled === false) {
        return res.status(201).json(
          formatSuccessResponse({
            eventId: null,
            warning: test.warningsEnabled
              ? {
                  counted: false,
                  number: null,
                  max: test.maxWarnings,
                  remaining: Math.max(0, test.maxWarnings - session.warningCount),
                  terminated: false,
                }
              : null,
          })
        );
      }

      // Rule 3: Store event with weight and save snapshot
      const weight = typeof rule.weight === 'number' ? rule.weight : 1;
      const eventId = crypto.randomUUID();
      let snapshotPath: string | null = null;

      if (req.file) {
        const snapshotsDir = path.join(process.cwd(), 'storage', 'snapshots');
        fs.mkdirSync(snapshotsDir, { recursive: true });
        const filename = `${eventId}.jpg`;
        const fullPath = path.join(snapshotsDir, filename);
        await fs.promises.writeFile(fullPath, req.file.buffer);
        snapshotPath = path.join('storage', 'snapshots', filename);
      }

      // Rule 4: Count warning only if warningsEnabled, rule.warn == true,
      // and no counted warning for this type within warningCooldownSec
      let shouldWarn = false;
      if (test.warningsEnabled && rule.warn === true) {
        const cooldownSec = rulesConfig.warningCooldownSec ?? 15;
        const cooldownMs = cooldownSec * 1000;
        const eventOccurredMs = epochMsFromInstant(occurredAt);

        const recentWarnings = await db.orm.public.Event.where({
          examSessionId: session.id,
          type,
          countedAsWarning: true,
        }).all();

        const withinCooldown = recentWarnings.some((e) => {
          const eMs = epochMsFromInstant(e.occurredAt);
          return Math.abs(eventOccurredMs - eMs) < cooldownMs;
        });

        if (!withinCooldown) {
          shouldWarn = true;
        }
      }

      // Rule 5: If counted: warningCount++, set event.countedAsWarning and warningNumber
      let newWarningCount = session.warningCount;
      let countedAsWarning = false;
      let warningNumber: number | null = null;

      if (shouldWarn) {
        countedAsWarning = true;
        newWarningCount = session.warningCount + 1;
        warningNumber = newWarningCount;
      }

      // Rule 6: If warningCount > maxWarnings and autoSubmitOnLimit: finalize with AUTO_SUBMITTED and WARNING_LIMIT
      let terminated = false;
      let autoSubmitted = false;

      if (newWarningCount > test.maxWarnings && test.autoSubmitOnLimit) {
        terminated = true;
        autoSubmitted = true;
      }

      // Create event in database
      const createdEvent = await db.orm.public.Event.create({
        id: eventId,
        examSessionId: session.id,
        type,
        occurredAt,
        durationMs: isNaN(durationMs as number) ? null : durationMs,
        snapshotPath,
        meta: parsedMeta,
        weight,
        countedAsWarning,
        warningNumber,
        review: 'PENDING',
      });

      // Rule 7: Update riskScore and riskLevel
      const allSessionEvents = await db.orm.public.Event.where({
        examSessionId: session.id,
      }).all();

      const newRiskScore = allSessionEvents.reduce((acc, e) => {
        return e.review === 'FALSE_ALARM' ? acc : acc + e.weight;
      }, 0);

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

      // Grade if autoSubmitted
      let calculatedScore: number | null = null;
      if (autoSubmitted) {
        const setQuestions = participant.setId
          ? await db.orm.public.Question.where({
              setId: participant.setId,
            }).all()
          : [];
        const answers = await db.orm.public.Answer.where({
          examSessionId: session.id,
        }).all();
        const answerMap = new Map(
          answers.map((a) => [a.questionId, a.selectedIndex])
        );

        let totalScore = 0;
        for (const q of setQuestions) {
          if (answerMap.get(q.id) === q.correctIndex) {
            totalScore += q.marks;
          }
        }
        calculatedScore = totalScore;
      }

      await db.orm.public.ExamSession.where({ id: session.id }).update({
        warningCount: newWarningCount,
        riskScore: newRiskScore,
        riskLevel: newRiskLevel,
        ...(autoSubmitted
          ? {
              status: 'AUTO_SUBMITTED',
              endReason: 'WARNING_LIMIT',
              score: calculatedScore,
              submittedAt: nowInstant(),
            }
          : {}),
      });

      const warningPayload = test.warningsEnabled
        ? {
            counted: countedAsWarning,
            number: warningNumber,
            max: test.maxWarnings,
            remaining: Math.max(0, test.maxWarnings - newWarningCount),
            terminated,
          }
        : null;

      res.status(201).json(
        formatSuccessResponse({
          eventId: createdEvent.id,
          warning: warningPayload,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 7. POST /exam/submit ────────────────────────────────────────────
examRouter.post('/submit', async (req, res, next) => {
  try {
    const { participant } = await getStudentContext(req.user!.id);
    const session = await db.orm.public.ExamSession.where({
      participantId: participant.id,
    }).first();

    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
    }

    // Idempotent: if already submitted, return current status
    if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
      return res.status(200).json(
        formatSuccessResponse({
          status: session.status,
          submittedAt: session.submittedAt ? session.submittedAt.toString() : null,
        })
      );
    }

    // Grade on server
    const setQuestions = participant.setId
      ? await db.orm.public.Question.where({ setId: participant.setId }).all()
      : [];
    const answers = await db.orm.public.Answer.where({
      examSessionId: session.id,
    }).all();
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));

    let totalScore = 0;
    for (const q of setQuestions) {
      if (answerMap.get(q.id) === q.correctIndex) {
        totalScore += q.marks;
      }
    }

    const submittedAt = nowInstant();

    await db.orm.public.ExamSession.where({ id: session.id }).update({
      status: 'SUBMITTED',
      endReason: 'SUBMITTED_BY_STUDENT',
      score: totalScore,
      submittedAt,
    });

    res.status(200).json(
      formatSuccessResponse({
        status: 'SUBMITTED',
        submittedAt: submittedAt.toString(),
      })
    );
  } catch (err) {
    next(err);
  }
});
