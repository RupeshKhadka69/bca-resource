import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long");

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    studentId: z.string().trim().min(1).optional(),
    password: z.string().trim().min(1),
  })
  .refine((value) => Boolean(value.identifier || value.studentId), {
    message: "Either identifier or studentId is required",
    path: ["identifier"],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1),
  newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
