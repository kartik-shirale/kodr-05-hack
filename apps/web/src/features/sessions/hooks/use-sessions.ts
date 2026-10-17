import { useQuery } from "@tanstack/react-query";
import { getTestSessionsApi } from "../api";
import { sessionKeys } from "../keys";
import type { SessionListQueryParams } from "../schemas";

export function useSessions(
  testId: string,
  params?: SessionListQueryParams,
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: sessionKeys.list(testId, params),
    queryFn: async () => {
      const response = await getTestSessionsApi(testId, params);
      return response;
    },
    enabled: Boolean(testId),
    refetchInterval: options?.refetchInterval,
  });
}
