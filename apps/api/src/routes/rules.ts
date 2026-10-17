import { Router } from 'express';
import { z } from 'zod';
import { DEFAULT_RULES_CONFIG } from '../config/rules.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant } from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const rulesRouter = Router({ mergeParams: true });

// Teacher only for all tuning/rules routes
rulesRouter.use(authenticate, requireRole('TEACHER'));

// ─── Constants ───────────────────────────────────────────────────────
const EVENT_TYPES = [
  'NO_FACE',
  'MULTIPLE_FACES',
  'LOOKING_AWAY',
  'PHONE_DETECTED',
  'TAB_SWITCH',
] as const;

// ─── Validation Schemas ──────────────────────────────────────────────
const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

const baseRuleSchema = z.object({
  enabled: z.boolean().default(true),
  weight: z.number().int().min(0).default(1),
  warn: z.boolean().default(false),
});

const noFaceRuleSchema = baseRuleSchema.extend({
  afterSec: z.number().min(0).default(3),
});

const multipleFacesRuleSchema = baseRuleSchema.extend({
  afterSec: z.number().min(0).default(2),
});

const lookingAwayRuleSchema = baseRuleSchema.extend({
  afterSec: z.number().min(0).default(5),
  yawDeg: z.number().min(0).max(180).default(35),
  ignoreLookingDown: z.boolean().default(true),
});

const phoneDetectedRuleSchema = baseRuleSchema.extend({
  afterSec: z.number().min(0).default(2),
  minConfidence: z.number().min(0).max(1).default(0.6),
});

const tabSwitchRuleSchema = baseRuleSchema;

const levelsSchema = z
  .object({
    medium: z.number().int().min(1).default(10),
    high: z.number().int().min(1).default(25),
  })
  .refine((l) => l.high > l.medium, {
    message: 'levels.high must be greater than levels.medium',
    path: ['high'],
  });

export const rulesConfigSchema = z.object({
  warningCooldownSec: z.number().int().min(0).default(15),
  NO_FACE: noFaceRuleSchema.default({
    enabled: true,
    afterSec: 3,
    weight: 3,
    warn: false,
  }),
  MULTIPLE_FACES: multipleFacesRuleSchema.default({
    enabled: true,
    afterSec: 2,
    weight: 4,
    warn: true,
  }),
  LOOKING_AWAY: lookingAwayRuleSchema.default({
    enabled: true,
    afterSec: 5,
    yawDeg: 35,
    ignoreLookingDown: true,
    weight: 1,
    warn: false,
  }),
  PHONE_DETECTED: phoneDetectedRuleSchema.default({
    enabled: true,
    minConfidence: 0.6,
    afterSec: 2,
    weight: 5,
    warn: true,
  }),
  TAB_SWITCH: tabSwitchRuleSchema.default({ enabled: true, weight: 2, warn: true }),
  levels: levelsSchema.default({ medium: 10, high: 25 }),
});

export const policySchema = z.object({
  warningsEnabled: z.boolean().default(true),
  maxWarnings: z.number().int().min(1).max(5).default(2),
  autoSubmitOnLimit: z.boolean().default(false),
});

export const updateRulesBodySchema = z.object({
  policy: policySchema.partial().optional(),
  rules: rulesConfigSchema.partial().optional(),
});

// Helper: load test and verify teacher ownership
async function getTeacherTest(testId: string, teacherId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test || test.teacherId !== teacherId) {
    throw new AppError(404, 'NOT_FOUND', 'Test not found');
  }
  return test;
}

// ─── 1. GET /tests/:testId/rules (Get Rules, Policy, and Stats) ──────
rulesRouter.get(
  '/',
  validate({ params: testIdParamSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      const test = await getTeacherTest(testId, teacherId);

      const startMs = epochMsFromInstant(test.startsAt);
      const locked = startMs <= Date.now();

      // Find all participants for this test
      const participants = await db.orm.public.Participant.where({ testId }).all();

      // Find exam sessions for participants
      const sessionResults = await Promise.all(
        participants.map((p) =>
          db.orm.public.ExamSession.where({ participantId: p.id }).first()
        )
      );
      const sessions = sessionResults.filter(
        (s): s is NonNullable<typeof s> => !!s
      );

      // Find all events for these sessions
      const eventResults = await Promise.all(
        sessions.map((s) =>
          db.orm.public.Event.where({ examSessionId: s.id }).all()
        )
      );
      const allEvents = eventResults.flat();

      // Compute statistics per event type
      const stats: Record<
        string,
        {
          total: number;
          pending: number;
          valid: number;
          falseAlarm: number;
          reviewedCount: number;
          falseAlarmRate: number;
          sessionsAffected: number;
        }
      > = {};

      for (const type of EVENT_TYPES) {
        const eventsOfType = allEvents.filter((e) => e.type === type);
        const total = eventsOfType.length;
        const pending = eventsOfType.filter((e) => e.review === 'PENDING').length;
        const valid = eventsOfType.filter((e) => e.review === 'VALID').length;
        const falseAlarm = eventsOfType.filter(
          (e) => e.review === 'FALSE_ALARM'
        ).length;
        const reviewedCount = valid + falseAlarm;
        const falseAlarmRate =
          reviewedCount > 0
            ? Number((falseAlarm / reviewedCount).toFixed(4))
            : 0;

        const sessionsAffected = new Set(
          eventsOfType.map((e) => e.examSessionId)
        ).size;

        stats[type] = {
          total,
          pending,
          valid,
          falseAlarm,
          reviewedCount,
          falseAlarmRate,
          sessionsAffected,
        };
      }

      res.status(200).json(
        formatSuccessResponse({
          policy: {
            warningsEnabled: test.warningsEnabled,
            maxWarnings: test.maxWarnings,
            autoSubmitOnLimit: test.autoSubmitOnLimit,
          },
          rules: test.rulesConfig ?? DEFAULT_RULES_CONFIG,
          stats,
          locked,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. PUT /tests/:testId/rules (Update Rules and Policy) ───────────
rulesRouter.put(
  '/',
  validate({ params: testIdParamSchema, body: updateRulesBodySchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      const test = await getTeacherTest(testId, teacherId);

      // Lock check: Only before startsAt, otherwise 409 TEST_LOCKED
      const startMs = epochMsFromInstant(test.startsAt);
      if (startMs <= Date.now()) {
        throw new AppError(
          409,
          'TEST_LOCKED',
          'Test has already started and rules can no longer be modified'
        );
      }

      const { policy, rules } = req.body as z.infer<typeof updateRulesBodySchema>;

      const updateData: any = {};

      if (policy) {
        if (typeof policy.warningsEnabled === 'boolean') {
          updateData.warningsEnabled = policy.warningsEnabled;
        }
        if (typeof policy.maxWarnings === 'number') {
          updateData.maxWarnings = policy.maxWarnings;
        }
        if (typeof policy.autoSubmitOnLimit === 'boolean') {
          updateData.autoSubmitOnLimit = policy.autoSubmitOnLimit;
        }
      }

      if (rules) {
        // Merge with existing rulesConfig or defaults
        const currentRules = (test.rulesConfig as any) || DEFAULT_RULES_CONFIG;
        const mergedRules = {
          ...currentRules,
          ...rules,
          // Ensure levels are merged properly if provided
          levels: rules.levels
            ? { ...currentRules.levels, ...rules.levels }
            : currentRules.levels,
        };
        updateData.rulesConfig = mergedRules;
      }

      if (Object.keys(updateData).length > 0) {
        await db.orm.public.Test.where({ id: testId }).update(updateData);
      }

      const updatedTest = await db.orm.public.Test.where({ id: testId }).first();

      res.status(200).json(
        formatSuccessResponse({
          policy: {
            warningsEnabled: updatedTest!.warningsEnabled,
            maxWarnings: updatedTest!.maxWarnings,
            autoSubmitOnLimit: updatedTest!.autoSubmitOnLimit,
          },
          rules: updatedTest!.rulesConfig,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
