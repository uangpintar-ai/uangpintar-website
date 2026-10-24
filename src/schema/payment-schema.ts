import { z } from "zod";

export const checkoutLeadSchema = z.object({
  email: z.string().min(1, "Email harus diisi").email("Email tidak valid"),
  first_name: z
    .string()
    .min(1, "Nama depan harus diisi")
    .max(30, "Nama depan maksimal 30 karakter"),
  last_name: z
    .string()
    .min(1, "Nama belakang harus diisi")
    .max(30, "Nama belakang maksimal 30 karakter"),
});

export type CheckoutLeadSchema = z.infer<typeof checkoutLeadSchema>;
