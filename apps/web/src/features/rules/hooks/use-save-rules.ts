import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTestRulesApi } from "../api";
import { ruleKeys } from "../keys";
import type { UpdateRulesInput } from "../schemas";

export function useSaveRules(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRulesInput) => updateTestRulesApi(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.detail(testId) });
    },
  });
}
