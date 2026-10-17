import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendCredentialsApi } from "../api";
import { participantKeys } from "../keys";

export function useSendCredentials(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sendCredentialsApi(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.list(testId) });
    },
  });
}
