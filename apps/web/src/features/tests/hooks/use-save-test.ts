import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTestApi, updateTestApi } from "../api";
import { testKeys } from "../keys";
import type { TestFormInput } from "../schemas";

export function useSaveTest(testId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TestFormInput) => {
      if (testId) {
        return updateTestApi(testId, data);
      }
      return createTestApi(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      if (testId) {
        queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
      }
    },
  });
}
