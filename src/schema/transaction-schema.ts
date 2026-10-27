import { z } from "zod";
import { paginationSchema } from "./pagination-schema";

export const transactionDetailSchema = z.object({
  name: z.string().min(1, "Nama rincian harus diisi"),
  amount: z.union([
    z.string().min(1, "Nominal harus diisi"),
    z.number().positive("Nominal harus diisi"),
  ]),
  categoryId: z.string().min(1).optional().nullable(),
});

export type TransactionDetailSchema = z.infer<typeof transactionDetailSchema>;

export const transactionCreateSchema = z.object({
  purpose: z.string().min(1, "Keterangan harus diisi"),
  type: z.enum(["INCOME", "EXPENSE"]),
  details: z.array(transactionDetailSchema).min(1, "Minimal satu rincian"),
  trx_date: z.date().optional(),
  walletId: z.string().min(1).optional().nullable(),
});

export type TransactionCreateSchema = z.infer<typeof transactionCreateSchema>;

export const transactionUpdateSchema = transactionCreateSchema.extend({
  id: z.string().min(1, "ID harus diisi"),
});

export type TransactionUpdateSchema = z.infer<typeof transactionUpdateSchema>;

export const transactionFilterSchema = paginationSchema.extend({
  search: z.string().optional().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]).optional().nullable(),
  walletIds: z.array(z.string()).optional().nullable(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  date_type: z.enum(["trx", "created"]).optional().nullable(),
});

export type TransactionFilterSchema = z.infer<typeof transactionFilterSchema>;

export const transactionSummarySchema = z.object({
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]).optional().nullable(),
  walletIds: z.array(z.string()).optional().nullable(),
});

export type TransactionSummarySchema = z.infer<typeof transactionSummarySchema>;

export const transactionChartSchema = transactionSummarySchema.extend({
  group_by: z.enum(["day", "month"]),
});

export type TransactionChartSchema = z.infer<typeof transactionChartSchema>;
