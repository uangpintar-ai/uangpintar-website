import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { fail, ok, verifyBearerToken } from "@/lib/mobile-auth";

const toDate = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export async function GET(req: NextRequest) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const start_date = toDate(sp.get("start_date"));
  const end_date = toDate(sp.get("end_date"));
  const typeRaw = sp.get("type");
  const type =
    typeRaw === "INCOME" || typeRaw === "EXPENSE" ? typeRaw : undefined;

  const where: Prisma.TransactionWhereInput = {
    userId: claims.userId,
    trxDate: {
      ...(start_date ? { gte: start_date } : {}),
      ...(end_date ? { lte: end_date } : {}),
    },
    ...(type ? { type } : {}),
  };

  const [transactions, user] = await Promise.all([
    db.transaction.findMany({
      where,
      select: { totalAmount: true, type: true },
    }),
    db.user.findUnique({
      where: { id: claims.userId },
      select: { balance: true },
    }),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME");
  const expense = transactions.filter((t) => t.type === "EXPENSE");

  return ok({
    balance: user?.balance ?? 0,
    income: {
      nominal: income.reduce((sum, t) => sum + t.totalAmount, 0),
      quantity: income.length,
    },
    expense: {
      nominal: expense.reduce((sum, t) => sum + t.totalAmount, 0),
      quantity: expense.length,
    },
  });
}
