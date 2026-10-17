import { z } from "zod";

export const consentSchema = z.object({
  accepted: z.literal(true),
});

export const answerSubmissionSchema = z.object({
  selectedIndex: z.number().int().min(0).nullable(),
});

export const eventUploadSchema = z.object({
  type: z.enum(["NO_FACE", "MULTIPLE_FACES", "LOOKING_AWAY", "PHONE_DETECTED", "TAB_SWITCH"]),
  occurredAt: z.string().datetime(),
  durationMs: z.number().int().min(0).optional(),
  meta: z.string().optional(), // JSON serialized string for multipart
  snapshot: z.any().optional(), // File or Blob for multipart
});

export interface ExamInfoResponse {
  test: {
    title: string;
    description?: string;
    startsAt: string;
    durationMinutes: number;
  };
  participant: {
    name: string;
    email: string;
  };
  policy: {
    warningsEnabled: boolean;
    maxWarnings: number;
    autoSubmitOnLimit: boolean;
  };
  serverTime: string;
  consentGiven: boolean;
  sessionStatus: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | null;
  canStart: boolean;
}

export interface ExamQuestionItem {
  id: string;
  text: string;
  options: string[];
  marks: number;
  order: number;
}

export interface ExamStartResponse {
  session: {
    id: string;
    endsAt: string;
    warningCount: number;
  };
  serverTime: string;
  test: {
    title: string;
    durationMinutes: number;
  };
  policy: {
    warningsEnabled: boolean;
    maxWarnings: number;
    autoSubmitOnLimit: boolean;
  };
  rules: Record<string, unknown>;
  questions: ExamQuestionItem[];
  answers: Array<{
    questionId: string;
    selectedIndex: number | null;
  }>;
}

export interface ExamStatusResponse {
  serverTime: string;
  endsAt: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  warningCount: number;
  answers: Array<{
    questionId: string;
    selectedIndex: number | null;
  }>;
}

export interface EventWarningResult {
  counted: boolean;
  number: number;
  max: number;
  remaining: number;
  terminated: boolean;
}

export interface ExamEventResponse {
  eventId: string;
  warning: EventWarningResult | null;
}

export type ConsentInput = z.infer<typeof consentSchema>;
export type AnswerSubmissionInput = z.infer<typeof answerSubmissionSchema>;
export type EventUploadInput = z.infer<typeof eventUploadSchema>;
