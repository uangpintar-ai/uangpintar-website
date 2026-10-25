import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { isPlanId } from "@/const/payment";
import { getMayarInvoice, isValidMayarWebhookToken } from "@/lib/mayar";
import { sendPasswordSetupEmail } from "@/lib/verification";
import { applyPlan } from "@/server/services/payment-service";

const sendSetupEmailIfNeeded = async (paymentId: string) => {
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

const webhookSchema = z.object({
  event: z.string(),
  data: z.object({
    transactionId: z.string().optional(),
    status: z.string().optional(),
    productId: z.string().optional(),
    extraData: z.record(z.unknown()).nullish(),
  }),
});

export const POST = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get("token");

  if (!isValidMayarWebhookToken(token)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = webhookSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const { event, data } = parsed.data;

  if (event !== "payment.received" || data.status !== "SUCCESS") {
    return NextResponse.json({ ok: true });
  }

  const orderId =
    typeof data.extraData?.orderId === "string"
      ? data.extraData.orderId
      : undefined;

  const matches: {
    id?: string;
    mayarTransactionId?: string;
    mayarInvoiceId?: string;
  }[] = [];

  if (orderId) matches.push({ id: orderId });
  if (data.transactionId)
    matches.push({ mayarTransactionId: data.transactionId });
  if (data.productId) matches.push({ mayarInvoiceId: data.productId });

  if (matches.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const payment = await db.payment.findFirst({ where: { OR: matches } });

  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  if (payment.status === "PAID") {
    try {
      await sendSetupEmailIfNeeded(payment.id);
    } catch (error) {
      console.error("Gagal mengirim email atur kata sandi:", error);
      return NextResponse.json(
        { message: "Gagal mengirim email" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  const invoiceId = payment.mayarInvoiceId ?? data.productId;
  if (!invoiceId) return NextResponse.json({ ok: true });

  const invoice = await getMayarInvoice(invoiceId);

  if (
    !invoice ||
    invoice.status !== "paid" ||
    invoice.amount !== payment.amount
  ) {
    console.warn("Mayar webhook invoice verification failed", {
      paymentId: payment.id,
      invoiceId,
      invoiceStatus: invoice?.status,
      invoiceAmount: invoice?.amount,
      paymentAmount: payment.amount,
    });
    return NextResponse.json(
      { message: "Verification failed" },
      { status: 502 },
    );
  }

  if (!isPlanId(payment.plan)) {
    return NextResponse.json({ ok: true });
  }

  const planId = payment.plan;

  await db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        mayarTransactionId: data.transactionId ?? undefined,
      },
    });

    if (claimed.count === 0) return;

    await applyPlan(tx, payment.userId, planId);
  });

  try {
    await sendSetupEmailIfNeeded(payment.id);
  } catch (error) {
    console.error("Gagal mengirim email atur kata sandi:", error);
    return NextResponse.json(
      { message: "Gagal mengirim email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
};
