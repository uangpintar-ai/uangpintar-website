import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { createPasswordSetupLink } from "@/lib/verification";

export const GET = async (request: Request) => {
  const paymentId = new URL(request.url).searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.json(
      { message: "Payment ID tidak valid" },
      { status: 400 },
    );
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      status: true,
      userId: true,
      user: { select: { password: true } },
    },
  });

  if (!payment || payment.status !== "PAID") {
    return NextResponse.json(
      { message: "Pembayaran belum selesai" },
      { status: 404 },
    );
  }

  if (payment.user.password) {
    return NextResponse.json({ hasPassword: true });
  }

  const link = await createPasswordSetupLink(payment.userId);

  return NextResponse.json({ link });
};
