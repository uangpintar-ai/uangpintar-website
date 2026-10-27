import { db } from "@/server/db";

export const DEFAULT_CATEGORY_NAME = "Lainnya";
export const DEFAULT_CATEGORY_ICON = "PiDotsThree";

export const DEFAULT_CATEGORIES = [
  { name: "Makanan & Minuman", icon: "PiForkKnife" },
  { name: "Transportasi", icon: "PiCar" },
  { name: "Belanja", icon: "PiShoppingCart" },
  { name: "Tagihan & Utilitas", icon: "PiReceipt" },
  { name: "Kesehatan", icon: "PiHeartbeat" },
  { name: "Gaji", icon: "PiMoney" },
  { name: "Bisnis/Penjualan", icon: "PiStorefront" },
  { name: "Freelance", icon: "PiBriefcase" },
  { name: "Investasi", icon: "PiChartLine" },
  { name: "Lainnya", icon: "PiDotsThree" },
].map((category, index) => ({ ...category, sortOrder: index + 1 }));

type DB = typeof db;

export const ensureDefaultCategory = async (client: DB, userId: string) => {
  const existing = await client.transactionCategory.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  try {
    await client.transactionCategory.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ userId, ...category })),
      skipDuplicates: true,
    });
  } catch {
    // Jika proses lain sudah membuat kategori, lanjut ambil yang ada.
  }

  const fallback = await client.transactionCategory.findFirst({
    where: { userId, name: DEFAULT_CATEGORY_NAME },
  });
  if (fallback) return fallback;

  const created = await client.transactionCategory.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!created) throw new Error("Gagal membuat kategori");
  return created;
};
