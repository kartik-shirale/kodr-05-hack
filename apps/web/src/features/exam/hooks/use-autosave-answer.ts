import { useMutation } from "@tanstack/react-query";
import { saveExamAnswerApi } from "../api";
import type { AnswerSubmissionInput } from "../schemas";

export function useAutosaveAnswer() {
  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: AnswerSubmissionInput;
    }) => saveExamAnswerApi(questionId, data),
    retry: 3,
  });
}
