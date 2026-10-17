import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { TestFormInput, TestSummary, TestDetail, TestListQueryParams } from "./schemas";

export async function createTestApi(data: TestFormInput) {
  return apiPost<TestDetail>("/tests", data);
}

export async function getTestsApi(params?: TestListQueryParams) {
  return apiGet<TestSummary[]>("/tests", { params });
}

export async function getTestByIdApi(testId: string) {
  return apiGet<TestDetail>(`/tests/${testId}`);
}

export async function updateTestApi(testId: string, data: TestFormInput) {
  return apiPut<TestDetail>(`/tests/${testId}`, data);
}

export async function deleteTestApi(testId: string) {
  return apiDelete<void>(`/tests/${testId}`);
}

export async function publishTestApi(testId: string) {
  return apiPost<{ status: "PUBLISHED" }>(`/tests/${testId}/publish`, {});
}
