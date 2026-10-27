import { db } from "@/server/db";

export const DEFAULT_WALLET_NAME = "Dompet Utama";

type DB = typeof db;

const netAmount = (
  transactions: { totalAmount: number; type: "INCOME" | "EXPENSE" }[],
) =>
  transactions.reduce(
    (sum, t) => sum + (t.type === "INCOME" ? t.totalAmount : -t.totalAmount),
    0,
  );

const pendingTransactions = (client: DB, userId: string) =>
  client.transaction.findMany({
    where: { userId, walletId: null },
    select: { totalAmount: true, type: true },
  });

const migratePendingTransactions = async (
  client: DB,
  userId: string,
  walletId: string,
  net: number,
) => {
  await client.transaction.updateMany({
    where: { userId, walletId: null },
    data: { walletId },
  });
  return client.wallet.update({
    where: { id: walletId },
    data: { balance: { increment: net } },
  });
};

export const ensureDefaultWallet = async (client: DB, userId: string) => {
  const existing = await client.wallet.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const pending = await pendingTransactions(client, userId);
  const net = netAmount(pending);

  if (existing) {
    if (pending.length > 0) {
      return migratePendingTransactions(client, userId, existing.id, net);
    }
    return existing;
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  try {
    const wallet = await client.wallet.create({
      data: {
        userId,
        name: DEFAULT_WALLET_NAME,
        balance: (user?.balance ?? 0) - net,
      },
    });
    if (pending.length > 0) {
      return migratePendingTransactions(client, userId, wallet.id, net);
    }
    return wallet;
  } catch {
    const raced = await client.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (!raced) throw new Error("Gagal membuat dompet");
    return raced;
  }
};
