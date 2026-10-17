import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resendParticipantCredentialsApi } from "../api";
import { participantKeys } from "../keys";

export function useResendCredentials(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) =>
      resendParticipantCredentialsApi(testId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.list(testId) });
    },
  });
}
