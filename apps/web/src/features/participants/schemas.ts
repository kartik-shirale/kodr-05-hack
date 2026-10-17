import { z } from "zod";

export const studentItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const addParticipantsSchema = z.object({
  students: z.array(studentItemSchema).min(1, "At least one student required").max(500, "Maximum 500 students per batch"),
});

export const participantListQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

export interface ParticipantItem {
  id: string;
  name: string;
  email: string;
  set: {
    id: string;
    name: string;
  };
  credentialsSentAt: string | null;
  emailError: string | null;
}

export interface AddParticipantsResult {
  created: number;
  skipped: Array<{ email: string; reason: string }>;
}

export interface SendCredentialsResult {
  sent: number;
  failed: number;
}

export type StudentItemInput = z.infer<typeof studentItemSchema>;
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;
export type ParticipantListQueryParams = z.infer<typeof participantListQuerySchema>;
