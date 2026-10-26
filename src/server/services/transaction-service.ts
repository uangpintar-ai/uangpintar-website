import { randomInt } from "crypto";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { ensureDefaultWallet } from "@/server/services/wallet-service";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const toFloat = (value: string | number) =>
  typeof value === "number"
    ? value
    : Number(String(value).replace(/[^\d.]/g, "")) || 0;

export const generateTrxId = () => {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHANUMERIC[randomInt(ALPHANUMERIC.length)];
  }
  return `TRX-${code}`;
};

export const mapDetails = (
  details: { name: string; amount: string | number }[],
) => details.map((d) => ({ name: d.name, amount: toFloat(d.amount) }));

export const sumDetails = (details: { amount: number }[]) =>
  details.reduce((sum, d) => sum + d.amount, 0);

export type TransactionInput = {
  category: "INCOME" | "EXPENSE";
  purpose: string;
  details: { name: string; amount: string | number }[];
  trx_date?: Date | null;
  walletId?: string | null;
};

const resolveWallet = async (userId: string, walletId?: string | null) => {
  if (!walletId) return ensureDefaultWallet(db, userId);
  const wallet = await db.wallet.findFirst({
    where: { id: walletId, userId },
  });
  if (!wallet) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Dompet tidak ditemukan",
    });
  }
  return wallet;
};

export const createTransaction = async (
  userId: string,
  input: TransactionInput,
) => {
  const wallet = await resolveWallet(userId, input.walletId);
  const details = mapDetails(input.details);
  const totalAmount = sumDetails(details);
  const balanceDelta = input.category === "INCOME" ? totalAmount : -totalAmount;
  await db.$transaction([
    db.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        trxId: generateTrxId(),
        trxDate: input.trx_date ?? new Date(),
        category: input.category,
        purpose: input.purpose,
        totalAmount,
        details: { create: details },
      },
    }),
    db.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: balanceDelta } },
    }),
    db.user.update({
      where: { id: userId },
      data: { balance: { increment: balanceDelta } },
    }),
  ]);
};

export const updateTransaction = async (
  userId: string,
  id: string,
  input: TransactionInput,
) => {
  const existing = await db.transaction.findFirst({ where: { id, userId } });
  if (!existing) return false;

  const currentWallet = existing.walletId
    ? await db.wallet.findFirst({ where: { id: existing.walletId, userId } })
    : await ensureDefaultWallet(db, userId);
  const wallet = currentWallet ?? (await ensureDefaultWallet(db, userId));
  const targetWallet = input.walletId
    ? await db.wallet.findFirst({ where: { id: input.walletId, userId } })
    : wallet;
  if (!targetWallet) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Dompet tidak ditemukan",
    });
  }

  const oldDelta =
    existing.category === "INCOME"
      ? existing.totalAmount
      : -existing.totalAmount;
  const details = mapDetails(input.details);
  const newAmount = sumDetails(details);
  const newDelta = input.category === "INCOME" ? newAmount : -newAmount;

  const walletUpdates =
    wallet.id === targetWallet.id
      ? [
          db.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: newDelta - oldDelta } },
          }),
        ]
      : [
          db.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: -oldDelta } },
          }),
          db.wallet.update({
            where: { id: targetWallet.id },
            data: { balance: { increment: newDelta } },
          }),
        ];

  await db.$transaction([
    db.transaction.update({
      where: { id },
      data: {
        walletId: targetWallet.id,
        trxDate: input.trx_date ?? undefined,
        category: input.category,
        purpose: input.purpose,
        totalAmount: newAmount,
        details: { deleteMany: {}, create: details },
      },
    }),
    ...walletUpdates,
    db.user.update({
      where: { id: userId },
      data: { balance: { increment: newDelta - oldDelta } },
    }),
  ]);
  return true;
};

export const deleteTransaction = async (userId: string, id: string) => {
  const existing = await db.transaction.findFirst({ where: { id, userId } });
  if (!existing) return false;

  const wallet =
    (existing.walletId
      ? await db.wallet.findFirst({ where: { id: existing.walletId, userId } })
      : null) ?? (await ensureDefaultWallet(db, userId));
  const balanceDelta =
    existing.category === "INCOME"
      ? -existing.totalAmount
      : existing.totalAmount;
  await db.$transaction([
    db.transaction.deleteMany({ where: { id, userId } }),
    db.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: balanceDelta } },
    }),
    db.user.update({
      where: { id: userId },
      data: { balance: { increment: balanceDelta } },
    }),
  ]);
  return true;
};
