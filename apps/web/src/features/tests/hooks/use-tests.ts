import { useQuery } from "@tanstack/react-query";
import { getTestsApi } from "../api";
import { testKeys } from "../keys";
import type { TestListQueryParams } from "../schemas";

export function useTests(params?: TestListQueryParams) {
  return useQuery({
    queryKey: testKeys.list(params),
    queryFn: async () => {
      const response = await getTestsApi(params);
      return response;
    },
  });
}
