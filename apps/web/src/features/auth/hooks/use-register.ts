import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerTeacherApi } from "../api";
import type { TeacherRegisterInput } from "../schemas";

export function useTeacherRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeacherRegisterInput) => registerTeacherApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
