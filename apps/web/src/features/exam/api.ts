import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import type {
  AnswerSubmissionInput,
  ConsentInput,
  ExamEventResponse,
  ExamInfoResponse,
  ExamStartResponse,
  ExamStatusResponse,
} from "./schemas";

export async function getExamInfoApi() {
  return apiGet<ExamInfoResponse>("/exam/info");
}

export async function submitConsentApi(data: ConsentInput = { accepted: true }) {
  return apiPost<{ status: string }>("/exam/consent", data);
}

export async function startExamApi() {
  return apiPost<ExamStartResponse>("/exam/start", {});
}

export async function getExamStatusApi() {
  return apiGet<ExamStatusResponse>("/exam/status");
}

export async function saveExamAnswerApi(questionId: string, data: AnswerSubmissionInput) {
  return apiPut<{ questionId: string; selectedIndex: number | null; savedAt: string }>(
    `/exam/answers/${questionId}`,
    data
  );
}

export async function uploadExamEventApi(formData: FormData) {
  return apiPost<ExamEventResponse>("/exam/events", formData);
}

export async function submitExamApi() {
  return apiPost<{ status: "SUBMITTED"; submittedAt: string }>("/exam/submit", {});
}
