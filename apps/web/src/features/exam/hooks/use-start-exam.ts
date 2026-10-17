import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startExamApi } from "../api";
import { examKeys } from "../keys";

export function useStartExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startExamApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}
