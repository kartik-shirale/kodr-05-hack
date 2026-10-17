import { useQuery } from "@tanstack/react-query";
import { getSessionDetailApi } from "../api";
import { sessionKeys } from "../keys";

export function useSession(examSessionId: string) {
  return useQuery({
    queryKey: sessionKeys.detail(examSessionId),
    queryFn: async () => {
      const response = await getSessionDetailApi(examSessionId);
      return response.data;
    },
    enabled: Boolean(examSessionId),
  });
}
