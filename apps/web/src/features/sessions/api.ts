import { apiGet, apiPatch } from "@/lib/api-client";
import type {
  ReviewActionInput,
  SessionDetailData,
  SessionListQueryParams,
  SessionTableRow,
  SessionEventItem,
} from "./schemas";

export async function getTestSessionsApi(testId: string, params?: SessionListQueryParams) {
  return apiGet<SessionTableRow[]>(`/tests/${testId}/sessions`, { params });
}

export async function getSessionDetailApi(examSessionId: string) {
  return apiGet<SessionDetailData>(`/sessions/${examSessionId}`);
}

export async function reviewEventApi(eventId: string, data: ReviewActionInput) {
  return apiPatch<{
    event: SessionEventItem;
    session: { riskScore: number; riskLevel: "LOW" | "MEDIUM" | "HIGH" };
  }>(`/events/${eventId}/review`, data);
}

export function getEventSnapshotUrl(eventId: string): string {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return `${baseURL}/api/v1/events/${eventId}/snapshot`;
}
