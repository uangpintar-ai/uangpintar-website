import type { UserStatus } from "@prisma/client";

export type PlanId = "pemula_monthly" | "pemula_yearly" | "jago_lifetime";

type Plan = {
  id: PlanId;
  name: string;
  period: string;
  amount: number;
  description: string;
  durationDays: number | null;
  status: UserStatus;
  maxAISession: number;
};

export const PLANS: Record<PlanId, Plan> = {
  pemula_monthly: {
    id: "pemula_monthly",
    name: "Pemula Bulanan",
    period: "1 bulan",
    amount: 20000,
    description: "Pemula Bulanan - 1 bulan",
    durationDays: 30,
    status: "PEMULA_BULANAN",
    maxAISession: 300,
  },
  pemula_yearly: {
    id: "pemula_yearly",
    name: "Pemula Tahunan",
    period: "12 bulan",
    amount: 199000,
    description: "Pemula Tahunan - 12 bulan",
    durationDays: 365,
    status: "PEMULA_TAHUNAN",
    maxAISession: 300,
  },
  jago_lifetime: {
    id: "jago_lifetime",
    name: "Paket Jago",
    period: "Lifetime",
    amount: 249000,
    description: "Paket Jago - akses lifetime (Promo Founder)",
    durationDays: null,
    status: "PAKET_JAGO",
    maxAISession: 500,
  },
};

export const isPlanId = (value: string | null | undefined): value is PlanId =>
  value === "pemula_monthly" ||
  value === "pemula_yearly" ||
  value === "jago_lifetime";
