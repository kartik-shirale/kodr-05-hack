import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publishTestApi } from "../api";
import { testKeys } from "../keys";

export function usePublishTest(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishTestApi(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
    },
  });
}
