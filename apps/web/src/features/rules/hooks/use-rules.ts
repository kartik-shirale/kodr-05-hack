import { useQuery } from "@tanstack/react-query";
import { getTestRulesApi } from "../api";
import { ruleKeys } from "../keys";

export function useRules(testId: string) {
  return useQuery({
    queryKey: ruleKeys.detail(testId),
    queryFn: async () => {
      const response = await getTestRulesApi(testId);
      return response.data;
    },
    enabled: Boolean(testId),
  });
}
