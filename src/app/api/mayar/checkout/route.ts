import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";
import { isPlanId, PLANS } from "@/const/payment";
import { createMayarInvoice } from "@/lib/mayar";
import {
  createPasswordSetupLink,
  sendPasswordSetupEmail,
} from "@/lib/verification";
import { checkoutLeadSchema } from "@/schema/payment-schema";
import { applyPlan } from "@/server/services/payment-service";

type CheckoutBody = {
  plan?: string;
  mobile?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  skip_payment?: boolean;
};

const normalizeMobile = (value: string) => value.replace(/[\s-]/g, "");
const isValidMobile = (value: string) => /^\+?\d{10,15}$/.test(value);

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;

  const planId = body?.plan;

  if (!isPlanId(planId)) {
    return NextResponse.json({ message: "Paket tidak valid" }, { status: 400 });
  }

  const skipPayment = body?.skip_payment === true;

  if (skipPayment && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "Pembayaran tidak dapat dilewati" },
      { status: 403 },
    );
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user.userId;

  if (sessionUserId && !skipPayment) {
    const pending = await db.payment.findFirst({
      where: {
        userId: sessionUserId,
        plan: planId,
        status: "PENDING",
        link: { not: null },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (pending?.link) {
      return NextResponse.json({ link: pending.link, paymentId: pending.id });
    }
  }

  let user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null = null;

  if (sessionUserId) {
    user = await db.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 },
      );
    }
  } else {
    const lead = checkoutLeadSchema.safeParse({
      email: body?.email,
      first_name: body?.first_name,
      last_name: body?.last_name,
    });

    if (!lead.success) {
      return NextResponse.json(
        { message: "Lengkapi data akun terlebih dahulu" },
        { status: 400 },
      );
    }

    const leadMobile = normalizeMobile(body?.mobile ?? "");

    if (!isValidMobile(leadMobile)) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tidak valid" },
        { status: 400 },
      );
    }

    const email = lead.data.email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        password: true,
      },
    });

    const phoneOwner = await db.user.findUnique({
      where: { phone: leadMobile },
      select: { id: true },
    });

    if (phoneOwner && phoneOwner.id !== existing?.id) {
      return NextResponse.json(
        {
          message: "Nomor HP sudah terdaftar. Silakan masuk terlebih dahulu.",
        },
        { status: 409 },
      );
    }

    if (existing) {
      if (existing.password) {
        return NextResponse.json(
          {
            message: "Email sudah terdaftar. Silakan masuk terlebih dahulu.",
          },
          { status: 409 },
        );
      }

      user = {
        id: existing.id,
        email: existing.email,
        firstName: lead.data.first_name,
        lastName: lead.data.last_name,
        phone: leadMobile,
      };

      if (
        existing.firstName !== user.firstName ||
        existing.lastName !== user.lastName ||
        existing.phone !== leadMobile
      ) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: leadMobile,
          },
        });
      }
    } else {
      try {
        user = await db.user.create({
          data: {
            email,
            firstName: lead.data.first_name,
            lastName: lead.data.last_name,
            phone: leadMobile,
            maxAISession: 20,
            packageStart: new Date(),
            packageRnd: new Date(),
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        });
      } catch {
        return NextResponse.json(
          {
            message: "Email sudah terdaftar. Silakan masuk terlebih dahulu.",
          },
          { status: 409 },
        );
      }
    }
  }

  if (!user) {
    return NextResponse.json(
      { message: "Gagal menyiapkan akun" },
      { status: 500 },
    );
  }

  const mobileInput = normalizeMobile(body?.mobile ?? "");
  const mobile = mobileInput || normalizeMobile(user.phone ?? "");

  if (!isValidMobile(mobile)) {
    return NextResponse.json(
      {
        message: "Nomor WhatsApp belum diisi. Lengkapi profil terlebih dahulu.",
      },
      { status: 400 },
    );
  }

  if (mobileInput && user.phone !== mobileInput) {
    const phoneOwner = await db.user.findUnique({
      where: { phone: mobileInput },
      select: { id: true },
    });

    if (phoneOwner && phoneOwner.id !== user.id) {
      return NextResponse.json(
        {
          message: "Nomor HP sudah terdaftar. Silakan masuk terlebih dahulu.",
        },
        { status: 409 },
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { phone: mobileInput },
    });
  }

  const plan = PLANS[planId];

  if (skipPayment) {
    const payment = await db.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          userId: user.id,
          plan: plan.id,
          amount: plan.amount,
          mobile,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      await applyPlan(tx, user.id, plan.id);

      return created;
    });

    const account = await db.user.findUnique({
      where: { id: user.id },
      select: { email: true, password: true },
    });

    let setupUrl: string | undefined;

    if (account && !account.password) {
      setupUrl = await createPasswordSetupLink(user.id);

      try {
        await sendPasswordSetupEmail({
          email: account.email,
          userId: user.id,
          link: setupUrl,
        });
        await db.payment.update({
          where: { id: payment.id },
          data: { setupEmailSentAt: new Date() },
        });
      } catch (error) {
        console.error(
          "Gagal mengirim email atur kata sandi (dev skip):",
          error,
        );
      }
    }

    return NextResponse.json({ skipped: true, setupUrl });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      plan: plan.id,
      amount: plan.amount,
      mobile,
      expiresAt,
      status: "PENDING",
    },
  });

  try {
    const invoice = await createMayarInvoice({
      plan: plan.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      mobile,
      orderId: payment.id,
      expiresAt,
    });

    await db.payment.update({
      where: { id: payment.id },
      data: {
        mayarInvoiceId: invoice.id,
        mayarTransactionId: invoice.transactionId,
        link: invoice.link,
      },
    });

    return NextResponse.json({ link: invoice.link, paymentId: payment.id });
  } catch (error) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    console.error("Mayar checkout error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal membuat pembayaran. Coba lagi.",
      },
      { status: 502 },
    );
  }
};
