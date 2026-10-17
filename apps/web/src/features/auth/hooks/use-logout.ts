import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "../api";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await logoutApi();
      } catch {
        // Ignore any errors from backend (e.g. token already expired / 401)
      }
    },
    onSettled: () => {
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    },
  });
}
