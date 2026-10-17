import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginTeacherApi, loginStudentApi } from "../api";
import type { TeacherLoginInput, StudentLoginInput } from "../schemas";

export function useTeacherLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeacherLoginInput) => loginTeacherApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useStudentLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudentLoginInput) => loginStudentApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
