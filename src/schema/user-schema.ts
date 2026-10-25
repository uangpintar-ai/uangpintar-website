import { z } from "zod";
import { paginationSchema } from "./pagination-schema";

export const registerSchema = z.object({
  email: z.string().min(1, "Email harus diisi").email("Email tidak valid"),
  first_name: z
    .string()
    .min(1, "First name harus diisi")
    .max(30, "First name max 30 karakter"),
  last_name: z
    .string()
    .min(1, "Last name harus diisi")
    .max(30, "Last name max 30 karakter"),
  phone: z
    .string()
    .min(1, "Nomor HP harus diisi")
    .regex(/^\+?[0-9\s-]{10,18}$/, "Nomor HP tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email harus diisi").email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  user_id: z.string().min(1, "User ID harus diisi"),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const changePasswordVerifySchema = z.object({
  user_id: z.string().min(1, "User ID harus diisi"),
  code: z.string().length(6, "Kode harus 6 digit"),
  new_password: z
    .string()
    .min(8, "Password baru minimal 8 karakter")
    .max(100, "Password baru maksimal 100 karakter"),
});

export type ChangePasswordVerifySchema = z.infer<
  typeof changePasswordVerifySchema
>;

export const resendRegisterCodeSchema = z.object({
  email: z.string().min(1, "Email harus diisi").email("Email tidak valid"),
});

export type ResendRegisterCodeSchema = z.infer<typeof resendRegisterCodeSchema>;

export const resendChangePasswordCodeSchema = z.object({
  user_id: z.string().min(1, "User ID harus diisi"),
});

export type ResendChangePasswordCodeSchema = z.infer<
  typeof resendChangePasswordCodeSchema
>;

export const verifyCodeSchema = z.object({
  type: z.enum(["register", "change_password"]),
  identifier: z.string().min(1, "Identitas harus diisi"),
  code: z.string().length(6, "Kode harus 6 digit"),
});

export type VerifyCodeSchema = z.infer<typeof verifyCodeSchema>;

export const userUpdateSchema = z.object({
  user_id: z.string().min(1, "User Id harus diisi"),
  first_name: z
    .string()
    .min(1, "First name harus diisi")
    .max(30, "First name max 30 karakter"),
  last_name: z
    .string()
    .min(1, "Last name harus diisi")
    .max(30, "Last name max 30 karakter"),
});

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

export const userDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1, "ID tidak boleh kosong"))
    .min(1, "Minimal 1 ID harus dipilih"),
});

export type UserDeleteSchema = z.infer<typeof userDeleteSchema>;

export const userFilterSchema = paginationSchema.extend({
  name: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
});

export type UserFilterSchema = z.infer<typeof userFilterSchema>;
