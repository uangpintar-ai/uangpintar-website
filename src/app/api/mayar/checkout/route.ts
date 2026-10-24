import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";
import { isPlanId, PLANS } from "@/const/payment";
import { createMayarInvoice } from "@/lib/mayar";
import { checkoutLeadSchema } from "@/schema/payment-schema";

type CheckoutBody = {
  plan?: string;
  mobile?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

const normalizeMobile = (value: string) => value.replace(/[\s-]/g, "");

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;

  const planId = body?.plan;
  const mobile = normalizeMobile(body?.mobile ?? "");

  if (!isPlanId(planId)) {
    return NextResponse.json({ message: "Paket tidak valid" }, { status: 400 });
  }

  if (!/^\+?\d{10,15}$/.test(mobile)) {
    return NextResponse.json(
      { message: "Nomor WhatsApp tidak valid" },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user.userId;

  let user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null = null;

  if (sessionUserId) {
    user = await db.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, email: true, firstName: true, lastName: true },
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

    const email = lead.data.email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
      },
    });

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
      };

      if (
        existing.firstName !== user.firstName ||
        existing.lastName !== user.lastName
      ) {
        await db.user.update({
          where: { id: existing.id },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
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
            maxAISession: 0,
            packageStart: new Date(),
            packageRnd: new Date(),
          },
          select: { id: true, email: true, firstName: true, lastName: true },
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

  const plan = PLANS[planId];

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      plan: plan.id,
      amount: plan.amount,
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
    });

    await db.payment.update({
      where: { id: payment.id },
      data: {
        mayarInvoiceId: invoice.id,
        mayarTransactionId: invoice.transactionId,
      },
    });

    return NextResponse.json({ link: invoice.link });
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
