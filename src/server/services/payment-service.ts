import type { Prisma } from "@prisma/client";
import { PLANS, isPlanId, type PlanId } from "@/const/payment";
import { getMayarInvoice } from "@/lib/mayar";
import { sendPasswordSetupEmail } from "@/lib/verification";
import { db } from "@/server/db";

const LIFETIME_END = new Date("2099-12-31T23:59:59.999Z");

export const sendSetupEmailIfNeeded = async (paymentId: string) => {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      status: true,
      setupEmailSentAt: true,
      userId: true,
      user: { select: { email: true, password: true } },
    },
  });

  if (!payment || payment.status !== "PAID" || payment.setupEmailSentAt) {
    return;
  }

  if (payment.user.password) return;

  const claimed = await db.payment.updateMany({
    where: { id: paymentId, setupEmailSentAt: null },
    data: { setupEmailSentAt: new Date() },
  });

  if (claimed.count === 0) return;

  try {
    await sendPasswordSetupEmail({
      email: payment.user.email,
      userId: payment.userId,
    });
  } catch (error) {
    await db.payment.update({
      where: { id: paymentId },
      data: { setupEmailSentAt: null },
    });
    throw error;
  }
};

export const syncPaymentFromMayar = async (paymentId: string) => {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      plan: true,
      amount: true,
      userId: true,
      mayarInvoiceId: true,
    },
  });

  if (!payment) return null;
  if (payment.status !== "PENDING") return payment.status;
  if (!payment.mayarInvoiceId || !isPlanId(payment.plan)) return payment.status;

  const planId = payment.plan;
  const invoice = await getMayarInvoice(payment.mayarInvoiceId).catch(
    () => null,
  );

  if (
    !invoice ||
    invoice.status !== "paid" ||
    invoice.amount !== payment.amount
  ) {
    return payment.status;
  }

  await db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (claimed.count === 0) return;

    await applyPlan(tx, payment.userId, planId);
  });

  try {
    await sendSetupEmailIfNeeded(payment.id);
  } catch (error) {
    console.error("Gagal mengirim email atur kata sandi:", error);
  }

  return "PAID" as const;
};

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
