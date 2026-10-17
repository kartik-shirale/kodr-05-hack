import { z } from "zod";

export const ruleConfigSchema = z.object({
  warningCooldownSec: z.number().int().min(0).default(15),
  NO_FACE: z.object({
    enabled: z.boolean(),
    afterSec: z.number().min(1),
    weight: z.number().min(0),
    warn: z.boolean(),
  }),
  MULTIPLE_FACES: z.object({
    enabled: z.boolean(),
    afterSec: z.number().min(1),
    weight: z.number().min(0),
    warn: z.boolean(),
  }),
  LOOKING_AWAY: z.object({
    enabled: z.boolean(),
    afterSec: z.number().min(1),
    yawDeg: z.number().min(10).max(90),
    ignoreLookingDown: z.boolean(),
    weight: z.number().min(0),
    warn: z.boolean(),
  }),
  PHONE_DETECTED: z.object({
    enabled: z.boolean(),
    minConfidence: z.number().min(0).max(1),
    afterSec: z.number().min(1),
    weight: z.number().min(0),
    warn: z.boolean(),
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

export const updateRulesBodySchema = z.object({
  policy: z.object({
    warningsEnabled: z.boolean(),
    maxWarnings: z.number().int().min(1).max(5),
    autoSubmitOnLimit: z.boolean(),
  }),
  rules: ruleConfigSchema,
});

export interface RuleStatItem {
  total: number;
  pending: number;
  valid: number;
  falseAlarm: number;
  falseAlarmRate: number;
  sessionsAffected: number;
}

export interface RulesResponseData {
  policy: {
    warningsEnabled: boolean;
    maxWarnings: number;
    autoSubmitOnLimit: boolean;
  };
  rules: z.infer<typeof ruleConfigSchema>;
  stats: Record<string, RuleStatItem>;
  locked: boolean;
}

export type RuleConfigInput = z.infer<typeof ruleConfigSchema>;
export type UpdateRulesInput = z.infer<typeof updateRulesBodySchema>;
