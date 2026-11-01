import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, defaults } from "pg";

// Prisma menyimpan DateTime sebagai UTC, sementara pg default memakai zona waktu
// server saat menulis Date. Paksa UTC agar filter tanggal konsisten di server mana pun.
defaults.parseInputDatesAsUTC = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
