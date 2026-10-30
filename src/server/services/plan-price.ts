import "server-only";
import { PLANS, type PlanId, type PlanPrices } from "@/const/payment";

const TEST_AMOUNT = 1000;

const priceMode = () => process.env.PLAN_PRICE_MODE?.trim().toLowerCase();

export const useTestPrice = () => {
  const mode = priceMode();

  if (mode === "test") return true;
  if (mode === "live" || mode === "production") return false;

  return process.env.NODE_ENV === "development";
};

const resolve = (amount: number) => (useTestPrice() ? TEST_AMOUNT : amount);

export const getPlanPrices = (): PlanPrices => ({
  pemula_monthly: resolve(PLANS.pemula_monthly.amount),
  pemula_yearly: resolve(PLANS.pemula_yearly.amount),
  jago_lifetime: resolve(PLANS.jago_lifetime.amount),
  jagoAfterPromo: resolve(299000),
});

export const getPlanPrice = (planId: PlanId) => getPlanPrices()[planId];
