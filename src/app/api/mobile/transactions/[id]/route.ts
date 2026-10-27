import { NextRequest } from "next/server";
import { fail, ok, str, verifyBearerToken } from "@/lib/mobile-auth";
import {
  deleteTransaction,
  updateTransaction,
  type TransactionInput,
} from "@/server/services/transaction-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const type = body?.type;
  const purpose = str(body?.purpose).trim();
  const details = Array.isArray(body?.details) ? body.details : [];

  if (type !== "INCOME" && type !== "EXPENSE") {
    return fail("Tipe transaksi tidak valid", 400);
  }
  if (!purpose) return fail("Keterangan harus diisi", 400);
  if (details.length === 0) return fail("Minimal satu rincian", 400);

  const input: TransactionInput = {
    type,
    purpose,
    details,
    trx_date: body?.trx_date ? new Date(body.trx_date) : null,
  };

  const updated = await updateTransaction(claims.userId, id, input);
  if (!updated) return fail("Transaksi tidak ditemukan", 404);

  return ok({ message: "Transaksi berhasil diperbarui" });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const { id } = await ctx.params;
  const deleted = await deleteTransaction(claims.userId, id);
  if (!deleted) return fail("Transaksi tidak ditemukan", 404);

  return ok({ message: "Transaksi berhasil dihapus" });
}
