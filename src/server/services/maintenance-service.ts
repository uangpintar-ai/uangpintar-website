import type { UserStatus } from "@prisma/client";
import { db } from "@/server/db";
import { PLANS } from "@/const/payment";
import { toWibDate, WIB_OFFSET_MS } from "@/lib/utils";

const FREE_MAX_AI_SESSION = 20;
const AI_RESET_PERIOD_MS = 31 * 24 * 60 * 60 * 1000;
const PAID_STATUSES: UserStatus[] = [
  "PEMULA_BULANAN",
  "PEMULA_TAHUNAN",
  "PAKET_JAGO",
];
const ACTIVE_STATUSES: UserStatus[] = ["GRATIS", ...PAID_STATUSES];

const maxAISessionForStatus = (status: UserStatus) => {
  if (status === "GRATIS") return FREE_MAX_AI_SESSION;

  return (
    Object.values(PLANS).find((plan) => plan.status === status)?.maxAISession ??
    FREE_MAX_AI_SESSION
  );
};

export const runDailyMaintenance = async () => {
  const now = new Date();
  const resetBefore = new Date(now.getTime() - AI_RESET_PERIOD_MS);

  await db.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: {
        status: { in: PAID_STATUSES },
        packageRnd: { lte: now },
      },
      data: {
        status: "GRATIS",
        maxAISession: FREE_MAX_AI_SESSION,
        aiSessionCount: 0,
        aiSessionResetAt: now,
      },
    });

    for (const status of ACTIVE_STATUSES) {
      await tx.user.updateMany({
        where: {
          status,
          aiSessionResetAt: { lte: resetBefore },
        },
        data: {
          maxAISession: maxAISessionForStatus(status),
          aiSessionCount: 0,
          aiSessionResetAt: now,
        },
      });
    }
  });
};

const nextWibMidnight = () => {
  const wib = toWibDate();

  return new Date(
    Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate() + 1) -
      WIB_OFFSET_MS,
  );
};

type CronGlobal = typeof globalThis & {
  __uangPintarDailyCron?: ReturnType<typeof setTimeout>;
};

const cronGlobal = globalThis as CronGlobal;

const scheduleNextRun = () => {
  const delay = Math.max(nextWibMidnight().getTime() - Date.now(), 1000);

  const timer = setTimeout(async () => {
    try {
      await runDailyMaintenance();
    } catch (error) {
      console.error("Gagal menjalankan maintenance harian:", error);
    }

    cronGlobal.__uangPintarDailyCron = undefined;
    scheduleNextRun();
  }, delay);

  timer.unref?.();
  cronGlobal.__uangPintarDailyCron = timer;
};

export const startDailyMaintenance = () => {
  if (cronGlobal.__uangPintarDailyCron) return;

  // Jalankan sekali saat start untuk mengejar jadwal yang terlewat.
  void runDailyMaintenance().catch((error) => {
    console.error("Gagal menjalankan maintenance harian:", error);
  });

  scheduleNextRun();
};
