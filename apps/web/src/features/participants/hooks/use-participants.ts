import { useQuery } from "@tanstack/react-query";
import { getParticipantsApi } from "../api";
import { participantKeys } from "../keys";
import type { ParticipantListQueryParams } from "../schemas";

export function useParticipants(testId: string, params?: ParticipantListQueryParams) {
  return useQuery({
    queryKey: participantKeys.list(testId, params),
    queryFn: async () => {
      const response = await getParticipantsApi(testId, params);
      return response;
    },
    enabled: Boolean(testId),
  });
}
