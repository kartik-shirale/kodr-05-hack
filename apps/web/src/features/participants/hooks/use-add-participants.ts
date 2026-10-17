import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addParticipantsApi } from "../api";
import { participantKeys } from "../keys";
import { testKeys } from "@/features/tests/keys";
import type { AddParticipantsInput } from "../schemas";

export function useAddParticipants(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddParticipantsInput) => addParticipantsApi(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(testId) });
    },
  });
}
