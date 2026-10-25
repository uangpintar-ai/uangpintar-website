import type { Prisma } from "@prisma/client";
import { PLANS, type PlanId } from "@/const/payment";

const LIFETIME_END = new Date("2099-12-31T23:59:59.999Z");

export const applyPlan = async (
  tx: Prisma.TransactionClient,
  userId: string,
  planId: PlanId,
) => {
  const plan = PLANS[planId];

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { packageStart: true, packageRnd: true },
  });

  if (!user) return;

  const now = new Date();
  const active = user.packageRnd.getTime() > now.getTime();
  const base = active ? user.packageRnd : now;
  const end =
    plan.durationDays === null
      ? LIFETIME_END
      : new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await tx.user.update({
    where: { id: userId },
    data: {
      status: plan.status,
      maxAISession: plan.maxAISession,
      aiSessionCount: 0,
      packageStart: active ? user.packageStart : now,
      packageRnd: end,
    },
  });
};
