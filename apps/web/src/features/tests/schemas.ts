import { z } from "zod";

export const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option text cannot be empty")).min(2, "At least 2 options required").max(6, "Max 6 options"),
  correctIndex: z.coerce.number().int().min(0),
  marks: z.coerce.number().min(1, "Marks must be at least 1").default(1),
  order: z.coerce.number().int().min(1).default(1),
});

export const questionSetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Set name is required"),
  questions: z.array(questionSchema).min(1, "At least one question required per set"),
});

export const testFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  startsAt: z.string().min(1, "Start time is required"),
  durationMinutes: z.coerce.number().int().min(5, "Minimum 5 minutes").max(480, "Maximum 480 minutes"),
  warningsEnabled: z.boolean().default(true),
  maxWarnings: z.coerce.number().int().min(1).max(5).default(2),
  autoSubmitOnLimit: z.boolean().default(true),
  sets: z.array(questionSetSchema).min(1, "At least one question set required"),
});


export const testListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export interface TestSummary {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  status: "DRAFT" | "PUBLISHED";
  participantCount: number;
  submittedCount: number;
}

export interface TestDetail extends z.infer<typeof testFormSchema> {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  rulesConfig?: Record<string, unknown>;
}

export type TestFormInput = z.infer<typeof testFormSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionSetInput = z.infer<typeof questionSetSchema>;
export type TestListQueryParams = z.infer<typeof testListQuerySchema>;
