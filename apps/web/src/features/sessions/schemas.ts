import { z } from "zod";

export const reviewActionSchema = z.object({
  review: z.enum(["VALID", "FALSE_ALARM", "PENDING"]),
});

export const sessionListQuerySchema = z.object({
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"]).optional(),
  sort: z.enum(["risk:desc", "name:asc", "score:desc"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export interface SessionTableRow {
  participantId: string;
  name: string;
  email: string;
  examSessionId?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  endReason?: "NORMAL" | "TIME_UP" | "WARNING_LIMIT";
  score?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  riskScore?: number;
  warningCount?: number;
  events: {
    total: number;
    pending: number;
    valid: number;
    falseAlarm: number;
  };
}

export interface SessionEventItem {
  id: string;
  type: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "PHONE_DETECTED" | "TAB_SWITCH";
  occurredAt: string;
  durationMs?: number;
  weight: number;
  countedAsWarning: boolean;
  warningNumber?: number;
  review: "VALID" | "FALSE_ALARM" | "PENDING";
  hasSnapshot: boolean;
  meta?: Record<string, unknown>;
}

export interface SessionDetailData {
  session: {
    id: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
    endReason?: string;
    startedAt: string;
    endsAt: string;
    submittedAt?: string;
    warningCount: number;
    score?: number;
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  participant: {
    name: string;
    email: string;
    set: {
      id: string;
      name: string;
    };
  };
  events: SessionEventItem[];
  answers: Array<{
    questionId: string;
    selectedIndex: number | null;
    correct?: boolean;
  }>;
}

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
export type SessionListQueryParams = z.infer<typeof sessionListQuerySchema>;
