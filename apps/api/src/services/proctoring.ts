import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  experimental_decide,
  generateObject,
  type Experimental_DecisionQuestion,
  type Experimental_DecisionState,
} from 'ai';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { config } from '../config/env.js';
import { DEFAULT_RULES_CONFIG } from '../config/rules.js';
import { db, instantFromMs, nowInstant } from '../prisma/db.js';
import { AppError } from '../utils/errors.js';

export type EventTypeName =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'LOOKING_AWAY'
  | 'PHONE_DETECTED'
  | 'TAB_SWITCH';

export interface RuleConfig {
  enabled: boolean;
  weight: number;
  warn: boolean;
  afterSec?: number;
  minConfidence?: number;
  yawDeg?: number;
  ignoreLookingDown?: boolean;
}

export interface ProctorRules {
  warningCooldownSec: number;
  NO_FACE: RuleConfig;
  MULTIPLE_FACES: RuleConfig;
  LOOKING_AWAY: RuleConfig;
  PHONE_DETECTED: RuleConfig;
  TAB_SWITCH: RuleConfig;
  levels: { medium: number; high: number };
}

export interface ProctoringTestPolicy {
  warningsEnabled: boolean;
  maxWarnings: number;
  autoSubmitOnLimit: boolean;
}

export interface Observation {
  imageUsable: boolean;
  unusableReason: 'dark' | 'blurred' | 'covered' | null;
  usableConfidence: number;
  faces: { count: number; confidence: number };
  phone: { visible: boolean; confidence: number };
  head: {
    direction: 'forward' | 'left' | 'right' | 'up' | 'down' | 'unknown';
    confidence: number;
  };
  notes: string;
}

type EventMeta = Record<string, string | number | boolean | null>;

export interface EventDraft {
  type: EventTypeName;
  occurredAtMs: number;
  durationMs: number | null;
  confidence: number;
  meta: EventMeta;
}

export interface CreatedEvent {
  id: string;
  type: EventTypeName;
  weight: number;
  countedAsWarning: boolean;
  warningNumber: number | null;
}

export interface ProctoringIngestResult {
  events: CreatedEvent[];
  warning: {
    count: number;
    max: number;
    counted: boolean;
    number: number | null;
    remaining: number;
    terminated: boolean;
  };
  risk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' };
}

export function resolveRules(raw: unknown): ProctorRules {
  const base = DEFAULT_RULES_CONFIG;
  const override = (raw && typeof raw === 'object' ? raw : {}) as Partial<ProctorRules>;
  return {
    warningCooldownSec: override.warningCooldownSec ?? base.warningCooldownSec,
    NO_FACE: { ...base.NO_FACE, ...(override.NO_FACE ?? {}) },
    MULTIPLE_FACES: { ...base.MULTIPLE_FACES, ...(override.MULTIPLE_FACES ?? {}) },
    LOOKING_AWAY: { ...base.LOOKING_AWAY, ...(override.LOOKING_AWAY ?? {}) },
    PHONE_DETECTED: { ...base.PHONE_DETECTED, ...(override.PHONE_DETECTED ?? {}) },
    TAB_SWITCH: { ...base.TAB_SWITCH, ...(override.TAB_SWITCH ?? {}) },
    levels: { ...base.levels, ...(override.levels ?? {}) },
  };
}

export function riskLevelFor(score: number, rules: ProctorRules): 'LOW' | 'MEDIUM' | 'HIGH' {
  return score >= rules.levels.high ? 'HIGH' : score >= rules.levels.medium ? 'MEDIUM' : 'LOW';
}

const detectionState = new Map<string, { firstSeenAt: number; lastEmittedAt: number }>();

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function shouldEmit(
  sessionId: string,
  type: EventTypeName,
  afterSec: number,
  cooldownSec: number,
  active: boolean,
  nowMs: number
): boolean {
  const key = `${sessionId}:${type}`;
  const entry = detectionState.get(key);

  if (!active) {
    if (entry) detectionState.delete(key);
    return false;
  }

  const current = entry ?? { firstSeenAt: nowMs, lastEmittedAt: 0 };
  detectionState.set(key, current);

  const sustained = nowMs - current.firstSeenAt >= afterSec * 1000;
  const cooled = current.lastEmittedAt === 0 || nowMs - current.lastEmittedAt >= cooldownSec * 1000;

  if (sustained && cooled) {
    current.lastEmittedAt = nowMs;
    return true;
  }
  return false;
}

const clientEventSchema = z.object({
  type: z.enum([
    'TAB_SWITCH',
    'NO_FACE',
    'MULTIPLE_FACES',
    'LOOKING_AWAY',
    'PHONE_DETECTED',
  ]),
  occurredAt: z.string().datetime().optional(),
  durationMs: z.number().int().min(0).max(600000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const OBSERVATION_QUESTIONS = {
  image_state: {
    type: 'choice',
    instructions:
      'Judge whether this single webcam snapshot of a student taking an online exam is clear enough to monitor.',
    criteria: {
      usable: 'The image is clear enough that the person can be seen and judged.',
      dark: 'The image is too dark to see the person clearly.',
      blurred: 'The image is too blurred to see the person clearly.',
      covered: 'The camera is covered, blocked, or shows no usable scene.',
    },
  },
  face_count: {
    type: 'choice',
    instructions:
      'Count the distinct real human faces clearly visible. Ignore posters, photos, and reflections.',
    criteria: {
      none: 'No real human face is visible.',
      one: 'Exactly one real human face is visible.',
      two: 'Exactly two real human faces are visible.',
      three_plus: 'Three or more real human faces are visible.',
    },
  },
  phone_visible: {
    type: 'boolean',
    instructions:
      'Is a phone, tablet, or similar handheld device actually visible in the image?',
    criteria: {
      true: 'A phone or similar handheld device is clearly visible.',
      false: 'No phone or handheld device is visible.',
    },
  },
  head_direction: {
    type: 'choice',
    instructions: 'Which way is the visible person facing relative to the screen?',
    criteria: {
      forward: 'Facing the screen or camera.',
      left: 'Head turned to their own left.',
      right: 'Head turned to their own right.',
      up: 'Looking up away from the screen.',
      down: 'Looking down, for example at a desk or keyboard.',
      unknown: 'No face is visible so the direction cannot be determined.',
    },
  },
} as const satisfies Record<string, Experimental_DecisionQuestion>;

export async function normalizeImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
}

const OBSERVATION_SCHEMA = z.object({
  imageUsable: z
    .boolean()
    .describe('True if the person can be seen clearly enough to judge, otherwise false.'),
  unusableReason: z
    .enum(['dark', 'blurred', 'covered'])
    .nullable()
    .describe('Why the image is unusable, or null when it is usable.'),
  usableConfidence: z.number().min(0).max(1),
  faces: z.object({
    count: z
      .number()
      .int()
      .min(0)
      .max(20)
      .describe('Distinct real human faces. Ignore posters, photos and reflections.'),
    confidence: z.number().min(0).max(1),
  }),
  phone: z.object({
    visible: z
      .boolean()
      .describe('True only if a phone, tablet or similar handheld device is actually visible.'),
    confidence: z.number().min(0).max(1),
  }),
  head: z.object({
    direction: z.enum(['forward', 'left', 'right', 'up', 'down', 'unknown']),
    confidence: z.number().min(0).max(1),
  }),
  notes: z.string().describe('Short free-text summary of what is visible.'),
});

const VISION_SYSTEM_PROMPT = [
  'You are an exam proctoring vision model. You receive a single webcam snapshot of a',
  'student during an online exam and must report objective observations only.',
  'Judge whether the image is clear enough to monitor. Count only distinct real human',
  'faces (ignore posters, photos and reflections). Only report a phone/tablet/handheld',
  'device when one is actually visible. If no face is visible, set head direction to',
  '"unknown". Do not guess.',
].join(' ');

let openRouterClient: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouterClient(): ReturnType<typeof createOpenRouter> | null {
  if (!config.proctor.openRouterApiKey) return null;
  if (!openRouterClient) {
    openRouterClient = createOpenRouter({
      apiKey: config.proctor.openRouterApiKey,
      appName: 'KodrKoder Proctor',
      ...(config.proctor.openRouterAppUrl ? { appUrl: config.proctor.openRouterAppUrl } : {}),
    });
  }
  return openRouterClient;
}

function resolveVisionProvider(): 'openrouter' | 'gateway' {
  const configured = config.proctor.visionProvider;
  if (configured === 'openrouter' || configured === 'gateway') return configured;
  return getOpenRouterClient() ? 'openrouter' : 'gateway';
}

async function observeWithOpenRouter(image: Buffer): Promise<Observation | null> {
  const client = getOpenRouterClient();
  if (!client) throw new Error('OpenRouter API key is not configured');

  const { object } = await generateObject({
    model: client.chat(config.proctor.openRouterModel),
    schema: OBSERVATION_SCHEMA,
    system: VISION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyse this webcam snapshot of a student during a proctored online exam.',
          },
          { type: 'file', mediaType: 'image/jpeg', data: image },
        ],
      },
    ],
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(config.proctor.visionTimeoutMs),
  });

  return {
    imageUsable: object.imageUsable,
    unusableReason: object.imageUsable ? null : object.unusableReason,
    usableConfidence: clamp01(object.usableConfidence),
    faces: {
      count: object.faces.count,
      confidence: clamp01(object.faces.confidence),
    },
    phone: {
      visible: object.phone.visible,
      confidence: clamp01(object.phone.confidence),
    },
    head: {
      direction: object.head.direction,
      confidence: clamp01(object.head.confidence),
    },
    notes: object.notes,
  };
}

async function observeWithGateway(image: Buffer): Promise<Observation | null> {
  const state: Experimental_DecisionState = [
    { type: 'text', text: 'A single webcam snapshot of a student during an online exam.' },
    { type: 'file', mediaType: 'image/jpeg', data: image },
  ];

  const result = await experimental_decide({
    model: config.proctor.visionModel,
    state,
    questions: OBSERVATION_QUESTIONS,
    headers: { 'typesafe-danger-zone-images': 'true' },
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(config.proctor.visionTimeoutMs),
  });

  const answers = result.answers;
  const imageState = answers.image_state.choice;
  const faceChoice = answers.face_count.choice;
  const faceCount =
    faceChoice === 'none' ? 0 : faceChoice === 'one' ? 1 : faceChoice === 'two' ? 2 : 3;
  const phoneProbability = clamp01(answers.phone_visible.probability);
  const direction = answers.head_direction.choice;

  return {
    imageUsable: imageState === 'usable',
    unusableReason: imageState === 'usable' ? null : imageState,
    usableConfidence: clamp01(answers.image_state.probabilities?.[imageState] ?? 1),
    faces: {
      count: faceCount,
      confidence: clamp01(answers.face_count.probabilities?.[faceChoice] ?? 1),
    },
    phone: { visible: phoneProbability >= 0.5, confidence: phoneProbability },
    head: {
      direction,
      confidence: clamp01(answers.head_direction.probabilities?.[direction] ?? 1),
    },
    notes: `state=${imageState}; faces=${faceCount}; phone=${phoneProbability.toFixed(2)}; dir=${direction}`,
  };
}

export async function observeImage(image: Buffer): Promise<Observation | null> {
  try {
    // OpenRouter serves OpenAI-compatible vision chat models; the JEV decision
    // endpoint (`experimental_decide`) only exists on the Vercel AI Gateway.
    return await (resolveVisionProvider() === 'openrouter'
      ? observeWithOpenRouter(image)
      : observeWithGateway(image));
  } catch (error) {
    console.error('Proctor vision analysis failed:', error);
    return null;
  }
}

function isLookingAway(observation: Observation, rules: ProctorRules): boolean {
  if (observation.faces.count !== 1) return false;
  const direction = observation.head.direction;
  if (direction === 'left' || direction === 'right' || direction === 'up') return true;
  if (direction === 'down' && !rules.LOOKING_AWAY.ignoreLookingDown) return true;
  return false;
}

export function buildVisionDrafts(
  sessionId: string,
  observation: Observation,
  rules: ProctorRules,
  nowMs: number
): EventDraft[] {
  const cooldown = rules.warningCooldownSec;
  const signals: Array<{
    type: EventTypeName;
    active: boolean;
    confidence: number;
    meta: EventMeta;
  }> = [
    {
      type: 'NO_FACE',
      active: !observation.imageUsable || observation.faces.count === 0,
      confidence: observation.imageUsable
        ? 1 - observation.faces.confidence
        : observation.usableConfidence,
      meta: {
        source: 'vision',
        imageUsable: observation.imageUsable,
        unusableReason: observation.unusableReason,
        faceCount: observation.faces.count,
        note: observation.notes,
      },
    },
    {
      type: 'MULTIPLE_FACES',
      active: observation.faces.count >= 2,
      confidence: observation.faces.confidence,
      meta: { source: 'vision', faceCount: observation.faces.count, note: observation.notes },
    },
    {
      type: 'PHONE_DETECTED',
      active:
        observation.phone.visible &&
        observation.phone.confidence >= (rules.PHONE_DETECTED.minConfidence ?? 0.6),
      confidence: observation.phone.confidence,
      meta: {
        source: 'vision',
        phoneVisible: observation.phone.visible,
        note: observation.notes,
      },
    },
    {
      type: 'LOOKING_AWAY',
      active: isLookingAway(observation, rules),
      confidence: observation.head.confidence,
      meta: {
        source: 'vision',
        headDirection: observation.head.direction,
        note: observation.notes,
      },
    },
  ];

  const drafts: EventDraft[] = [];
  for (const signal of signals) {
    const rule = rules[signal.type];
    if (!rule.enabled) {
      shouldEmit(sessionId, signal.type, rule.afterSec ?? 0, cooldown, false, nowMs);
      continue;
    }
    const emit = shouldEmit(
      sessionId,
      signal.type,
      rule.afterSec ?? 0,
      cooldown,
      signal.active,
      nowMs
    );
    if (emit) {
      drafts.push({
        type: signal.type,
        occurredAtMs: nowMs,
        durationMs: null,
        confidence: clamp01(signal.confidence),
        meta: signal.meta,
      });
    }
  }
  return drafts;
}

export function parseClientEventDrafts(
  body: Record<string, unknown>,
  rules: ProctorRules,
  nowMs: number
): Array<{ draft: EventDraft; afterSec: number }> {
  const rawEvents = body.events;
  let parsed: unknown[] = [];

  if (typeof rawEvents === 'string' && rawEvents.trim().length > 0) {
    let json: unknown;
    try {
      json = JSON.parse(rawEvents);
    } catch {
      throw new AppError(400, 'VALIDATION_ERROR', 'events must be valid JSON');
    }
    parsed = Array.isArray(json) ? json : [json];
  } else if (typeof body.type === 'string') {
    let meta: unknown;
    if (typeof body.meta === 'string' && body.meta.trim().length > 0) {
      try {
        meta = JSON.parse(body.meta);
      } catch {
        throw new AppError(400, 'VALIDATION_ERROR', 'meta must be valid JSON');
      }
    }
    parsed = [
      {
        type: body.type,
        occurredAt: typeof body.occurredAt === 'string' ? body.occurredAt : undefined,
        durationMs: body.durationMs !== undefined ? Number(body.durationMs) : undefined,
        meta,
      },
    ];
  }

  const events = z.array(clientEventSchema).max(50).parse(parsed);
  return events.map((event) => ({
    draft: {
      type: event.type,
      occurredAtMs:
        event.occurredAt !== undefined ? new Date(event.occurredAt).getTime() : nowMs,
      durationMs: event.durationMs ?? null,
      confidence: 1,
      meta: { source: 'client', ...(event.meta ?? {}) },
    },
    afterSec: 0,
  }));
}

export async function saveSnapshot(examSessionId: string, image: Buffer): Promise<string> {
  const directory = path.resolve(
    process.cwd(),
    config.proctor.uploadDir,
    'snapshots',
    examSessionId
  );
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  const absolute = path.join(directory, filename);
  await writeFile(absolute, image);
  return path.relative(process.cwd(), absolute);
}

async function persistEvents(options: {
  examSessionId: string;
  drafts: EventDraft[];
  rules: ProctorRules;
  policy: ProctoringTestPolicy;
  snapshotPath: string | null;
}): Promise<ProctoringIngestResult> {
  const { examSessionId, drafts, rules, policy, snapshotPath } = options;

  return db.transaction(async (tx) => {
    const locked = await tx.orm.public.ExamSession.where({ id: examSessionId })
      .forNoKeyUpdate()
      .first();
    if (!locked) {
      throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
    }
    if (locked.status !== 'IN_PROGRESS') {
      throw new AppError(409, 'SESSION_ENDED', 'Exam session already ended');
    }

    let warningCount = locked.warningCount;
    let riskScore = locked.riskScore;
    let terminated = false;
    const created: CreatedEvent[] = [];

    for (const draft of drafts) {
      const rule = rules[draft.type];
      const weight = rule.weight;
      let countedAsWarning = false;
      let warningNumber: number | null = null;

      if (rule.warn && policy.warningsEnabled) {
        if (warningCount < policy.maxWarnings) {
          warningCount += 1;
          warningNumber = warningCount;
          countedAsWarning = true;
        } else if (policy.autoSubmitOnLimit) {
          terminated = true;
          countedAsWarning = true;
        }
      }

      riskScore += weight;

      const row = await tx.orm.public.Event.create({
        examSessionId,
        type: draft.type,
        occurredAt: instantFromMs(draft.occurredAtMs),
        durationMs: draft.durationMs,
        snapshotPath: draft.meta['source'] === 'vision' ? snapshotPath : null,
        meta: { confidence: draft.confidence, ...draft.meta },
        weight,
        countedAsWarning,
        warningNumber,
      });

      created.push({
        id: row.id,
        type: draft.type,
        weight,
        countedAsWarning,
        warningNumber,
      });
    }

    const riskLevel = riskLevelFor(riskScore, rules);

    if (terminated) {
      await tx.orm.public.ExamSession.where({ id: examSessionId }).update({
        warningCount,
        riskScore,
        riskLevel,
        status: 'AUTO_SUBMITTED',
        endReason: 'WARNING_LIMIT',
        submittedAt: nowInstant(),
      });
    } else {
      await tx.orm.public.ExamSession.where({ id: examSessionId }).update({
        warningCount,
        riskScore,
        riskLevel,
      });
    }

    const counted = created.find((event) => event.countedAsWarning);
    return {
      events: created,
      warning: {
        count: warningCount,
        max: policy.maxWarnings,
        counted: Boolean(counted),
        number: counted?.warningNumber ?? null,
        remaining: Math.max(0, policy.maxWarnings - warningCount),
        terminated,
      },
      risk: { score: riskScore, level: riskLevel },
    };
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.proctor.maxImageBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new AppError(400, 'VALIDATION_ERROR', 'Unsupported snapshot image type'));
  },
});

const ingestUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'snapshot', maxCount: 1 },
]);

export function proctorUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  ingestUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Snapshot image is too large'
          : `Invalid upload: ${error.code}`;
      next(new AppError(400, 'VALIDATION_ERROR', message));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}

export function extractSnapshot(req: Request): Buffer | null {
  const files = req.files as
    | Record<string, Express.Multer.File[] | undefined>
    | undefined;
  const file = files?.image?.[0] ?? files?.snapshot?.[0];
  return file ? file.buffer : null;
}

export async function ingestProctoring(options: {
  req: Request;
  examSessionId: string;
  rules: ProctorRules;
  policy: ProctoringTestPolicy;
}): Promise<ProctoringIngestResult> {
  const { req, examSessionId, rules, policy } = options;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const nowMs = Date.now();

  const clientCandidates = parseClientEventDrafts(body, rules, nowMs);
  const drafts: EventDraft[] = [];

  for (const { draft, afterSec } of clientCandidates) {
    const rule = rules[draft.type];
    if (!rule.enabled) continue;
    if (shouldEmit(examSessionId, draft.type, afterSec, rules.warningCooldownSec, true, nowMs)) {
      drafts.push(draft);
    }
  }

  const rawImage = extractSnapshot(req);
  let normalized: Buffer | null = null;
  let visionDrafts: EventDraft[] = [];
  if (rawImage) {
    normalized = await normalizeImage(rawImage);
    const observation = await observeImage(normalized);
    if (observation) {
      visionDrafts = buildVisionDrafts(examSessionId, observation, rules, nowMs);
      drafts.push(...visionDrafts);
    }
  }

  // No violation on this frame: nothing to persist, nothing to store.
  if (drafts.length === 0) {
    return {
      events: [],
      warning: {
        count: 0,
        max: policy.maxWarnings,
        counted: false,
        number: null,
        remaining: policy.maxWarnings,
        terminated: false,
      },
      risk: { score: 0, level: 'LOW' },
    };
  }

  // Only high-risk frames (a vision-detected violation) are kept as evidence.
  // Normal frames are analysed and discarded.
  let snapshotPath: string | null = null;
  if (normalized && visionDrafts.length > 0 && isHighRiskFrame(visionDrafts, rules)) {
    snapshotPath = await saveSnapshot(examSessionId, normalized);
  }

  return persistEvents({ examSessionId, drafts, rules, policy, snapshotPath });
}

function isHighRiskFrame(drafts: EventDraft[], rules: ProctorRules): boolean {
  return drafts.some((draft) => {
    if (draft.type === 'MULTIPLE_FACES' || draft.type === 'PHONE_DETECTED') return true;
    if (draft.type === 'NO_FACE') return true;
    const rule = rules[draft.type];
    const threshold = rule.minConfidence ?? 0.6;
    return draft.confidence >= threshold;
  });
}
