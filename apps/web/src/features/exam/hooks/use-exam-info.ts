import { useQuery } from "@tanstack/react-query";
import { getExamInfoApi } from "../api";
import { examKeys } from "../keys";

export function useExamInfo() {
  return useQuery({
    queryKey: examKeys.info(),
    queryFn: async () => {
      const response = await getExamInfoApi();
      return response.data;
    },
  });
}
