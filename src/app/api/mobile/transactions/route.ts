import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { fail, ok, str, verifyBearerToken } from "@/lib/mobile-auth";
import {
  createTransaction,
  type TransactionInput,
} from "@/server/services/transaction-service";

const toDate = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export async function GET(req: NextRequest) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.max(1, Number(sp.get("limit")) || 10);
  const search = sp.get("search") || undefined;
  const typeRaw = sp.get("type");
  const type =
    typeRaw === "INCOME" || typeRaw === "EXPENSE" ? typeRaw : undefined;
  const date_type = sp.get("date_type") || undefined;
  const start_date = toDate(sp.get("start_date"));
  const end_date = toDate(sp.get("end_date"));

  const dateFilter = {
    ...(start_date ? { gte: start_date } : {}),
    ...(end_date ? { lte: end_date } : {}),
  };
  const where: Prisma.TransactionWhereInput = {
    userId: claims.userId,
    ...(date_type === "created"
      ? { createdAt: dateFilter }
      : { trxDate: dateFilter }),
    ...(search
      ? {
          OR: [
            { trxId: { contains: search, mode: "insensitive" as const } },
            { purpose: { contains: search, mode: "insensitive" as const } },
            {
              details: {
                some: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
  };

  const [items, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { details: { orderBy: { createdAt: "asc" } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.transaction.count({ where }),
  ]);

  return ok({
    items,
    meta: {
      page,
      limit,
      total_page: Math.ceil(total / limit),
      total_item: total,
    },
  });
}

export async function POST(req: NextRequest) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const type = body?.type;
  const purpose = str(body?.purpose).trim();
  const details = Array.isArray(body?.details) ? body.details : [];

  if (type !== "INCOME" && type !== "EXPENSE") {
    return fail("Tipe transaksi tidak valid", 400);
  }
  if (!purpose) return fail("Keterangan harus diisi", 400);
  if (details.length === 0) return fail("Minimal satu rincian", 400);

  for (const d of details) {
    if (!d?.name || !String(d.name).trim()) {
      return fail("Nama rincian harus diisi", 400);
    }
    if (d?.amount == null || d.amount === "") {
      return fail("Nominal harus diisi", 400);
    }
  }

  const input: TransactionInput = {
    type,
    purpose,
    details,
    trx_date: body?.trx_date ? new Date(body.trx_date) : null,
  };

  await createTransaction(claims.userId, input);
  return ok({ message: "Transaksi berhasil dicatat" }, 201);
}
