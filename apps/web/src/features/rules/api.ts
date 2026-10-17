import { apiGet, apiPut } from "@/lib/api-client";
import type { RulesResponseData, UpdateRulesInput } from "./schemas";

export async function getTestRulesApi(testId: string) {
  return apiGet<RulesResponseData>(`/tests/${testId}/rules`);
}

export async function updateTestRulesApi(testId: string, data: UpdateRulesInput) {
  return apiPut<{ status: string }>(`/tests/${testId}/rules`, data);
}
