import { useQuery } from "@tanstack/react-query";
import { getMeApi } from "../api";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await getMeApi();
      return response.data;
    },
    retry: false,
  });
}
