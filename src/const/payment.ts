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
    name: "Paket Pemula",
    period: "Bulanan",
    amount: 1000,
    description: "Paket Pemula - 1 bulan",
    durationDays: 30,
    status: "PINTAR_NGETIK",
    maxAISession: 150,
  },
  pemula_yearly: {
    id: "pemula_yearly",
    name: "Paket Pemula",
    period: "Tahunan",
    amount: 199000,
    description: "Paket Pemula - 12 bulan",
    durationDays: 365,
    status: "PINTAR_NGETIK",
    maxAISession: 150,
  },
  jago_lifetime: {
    id: "jago_lifetime",
    name: "Paket Jago",
    period: "Lifetime",
    amount: 249000,
    description: "Paket Jago - akses lifetime (Promo Founder)",
    durationDays: null,
    status: "PINTAR_NGOMONG",
    maxAISession: 500,
  },
};

export const isPlanId = (value: string | null | undefined): value is PlanId =>
  value === "pemula_monthly" ||
  value === "pemula_yearly" ||
  value === "jago_lifetime";
