import { useQuery } from "@tanstack/react-query";
import { getTestByIdApi } from "../api";
import { testKeys } from "../keys";

export function useTest(testId: string) {
  return useQuery({
    queryKey: testKeys.detail(testId),
    queryFn: async () => {
      const response = await getTestByIdApi(testId);
      return response.data;
    },
    enabled: Boolean(testId),
  });
}
