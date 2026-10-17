import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewEventApi } from "../api";
import { sessionKeys } from "../keys";
import { ruleKeys } from "@/features/rules/keys";
import type { ReviewActionInput } from "../schemas";

export function useReviewEvent(examSessionId: string, testId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: ReviewActionInput }) =>
      reviewEventApi(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(examSessionId) });
      if (testId) {
        queryClient.invalidateQueries({ queryKey: sessionKeys.list(testId) });
        queryClient.invalidateQueries({ queryKey: ruleKeys.detail(testId) });
      }
    },
  });
}
