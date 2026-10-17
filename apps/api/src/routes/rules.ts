import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant } from '../prisma/db.js';
import { resolveRules } from '../services/proctoring.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const testRulesRouter = Router({ mergeParams: true });

testRulesRouter.use(authenticate, requireRole('TEACHER'));

const EVENT_TYPES = [
  'NO_FACE',
  'MULTIPLE_FACES',
  'LOOKING_AWAY',
  'PHONE_DETECTED',
  'TAB_SWITCH',
] as const;

const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

const timedRuleSchema = z.object({
  enabled: z.boolean(),
  afterSec: z.number().min(1),
  weight: z.number().min(0),
  warn: z.boolean(),
});

const ruleConfigSchema = z.object({
  warningCooldownSec: z.number().int().min(0),
  NO_FACE: timedRuleSchema,
  MULTIPLE_FACES: timedRuleSchema,
  LOOKING_AWAY: timedRuleSchema.extend({
    yawDeg: z.number().min(10).max(90),
    ignoreLookingDown: z.boolean(),
  }),
  PHONE_DETECTED: timedRuleSchema.extend({
    minConfidence: z.number().min(0).max(1),
  }),
  TAB_SWITCH: z.object({
    enabled: z.boolean(),
    weight: z.number().min(0),
    warn: z.boolean(),
  }),
  levels: z.object({
    medium: z.number().min(1),
    high: z.number().min(1),
  }),
});

const updateRulesBodySchema = z.object({
  policy: z.object({
    warningsEnabled: z.boolean(),
    maxWarnings: z.number().int().min(1).max(5),
    autoSubmitOnLimit: z.boolean(),
  }),
  rules: ruleConfigSchema,
});

async function getTeacherTest(testId: string, teacherId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  return test;
}

async function computeStats(testId: string) {
  const participants = await db.orm.public.Participant.where({ testId }).all();
  const participantIds = new Set(participants.map((participant) => participant.id));

  const allSessions = await db.orm.public.ExamSession.all();
  const sessions = allSessions.filter((session) => participantIds.has(session.participantId));
  const sessionIds = new Set(sessions.map((session) => session.id));

  const allEvents = await db.orm.public.Event.all();
  const events = allEvents.filter((event) => sessionIds.has(event.examSessionId));

  const stats: Record<
    string,
    {
      total: number;
      pending: number;
      valid: number;
      falseAlarm: number;
      falseAlarmRate: number;
      sessionsAffected: number;
    }
  > = {};

  for (const type of EVENT_TYPES) {
    const typeEvents = events.filter((event) => event.type === type);
    const pending = typeEvents.filter((event) => event.review === 'PENDING').length;
    const valid = typeEvents.filter((event) => event.review === 'VALID').length;
    const falseAlarm = typeEvents.filter((event) => event.review === 'FALSE_ALARM').length;
    const total = typeEvents.length;

    stats[type] = {
      total,
      pending,
      valid,
      falseAlarm,
      falseAlarmRate: total > 0 ? falseAlarm / total : 0,
      sessionsAffected: new Set(typeEvents.map((event) => event.examSessionId)).size,
    };
  }

  return stats;
}

// ─── GET /tests/:testId/rules ────────────────────────────────────────
testRulesRouter.get(
  '/',
  validate({ params: testIdParamSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const test = await getTeacherTest(testId, req.user!.id);

      const locked = Date.now() >= epochMsFromInstant(test.startsAt);
      const stats = await computeStats(testId);

      res.status(200).json(
        formatSuccessResponse({
          policy: {
            warningsEnabled: test.warningsEnabled,
            maxWarnings: test.maxWarnings,
            autoSubmitOnLimit: test.autoSubmitOnLimit,
          },
          rules: resolveRules(test.rulesConfig),
          stats,
          locked,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /tests/:testId/rules ────────────────────────────────────────
testRulesRouter.put(
  '/',
  validate({ params: testIdParamSchema, body: updateRulesBodySchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const test = await getTeacherTest(testId, req.user!.id);

      if (Date.now() >= epochMsFromInstant(test.startsAt)) {
        throw new AppError(409, 'TEST_LOCKED', 'Rules cannot be changed after the test starts');
      }

      const { policy, rules } = req.body as z.infer<typeof updateRulesBodySchema>;

      await db.orm.public.Test.where({ id: testId }).update({
        warningsEnabled: policy.warningsEnabled,
        maxWarnings: policy.maxWarnings,
        autoSubmitOnLimit: policy.autoSubmitOnLimit,
        rulesConfig: rules,
      });

      res.status(200).json(formatSuccessResponse({ status: 'updated' }));
    } catch (err) {
      next(err);
    }
  }
);
