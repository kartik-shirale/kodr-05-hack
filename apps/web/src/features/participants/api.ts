import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import type {
  AddParticipantsInput,
  AddParticipantsResult,
  ParticipantItem,
  ParticipantListQueryParams,
  SendCredentialsResult,
} from "./schemas";

export async function addParticipantsApi(testId: string, data: AddParticipantsInput) {
  return apiPost<AddParticipantsResult>(`/tests/${testId}/participants`, data);
}

export async function getParticipantsApi(testId: string, params?: ParticipantListQueryParams) {
  return apiGet<ParticipantItem[]>(`/tests/${testId}/participants`, { params });
}

export async function deleteParticipantApi(testId: string, participantId: string) {
  return apiDelete<void>(`/tests/${testId}/participants/${participantId}`);
}

export async function sendCredentialsApi(testId: string) {
  return apiPost<SendCredentialsResult>(`/tests/${testId}/participants/send-credentials`, {});
}

export async function resendParticipantCredentialsApi(testId: string, participantId: string) {
  return apiPost<{ status: string }>(`/tests/${testId}/participants/${participantId}/resend`, {});
}
