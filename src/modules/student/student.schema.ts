import { z } from "zod";

export const createStudentSchema = z.object({
  studentId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  temporaryPassword: z
    .string()
    .min(8, "Temporary password must be at least 8 characters long"),
});

export const updateStudentSchema = z
  .object({
    studentId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const resetStudentPasswordSchema = z.object({
  temporaryPassword: z
    .string()
    .min(8, "Temporary password must be at least 8 characters long"),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const studentParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ResetStudentPasswordInput = z.infer<
  typeof resetStudentPasswordSchema
>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type StudentParamsInput = z.infer<typeof studentParamsSchema>;
