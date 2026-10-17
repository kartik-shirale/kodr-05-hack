import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  status: z.number(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
});

export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  });

export type ApiErrorSchemaType = z.infer<typeof apiErrorSchema>;
export type PaginationMetaSchemaType = z.infer<typeof paginationMetaSchema>;
