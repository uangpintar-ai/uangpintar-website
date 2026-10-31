import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { syncPaymentFromMayar } from "@/server/services/payment-service";

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
    select: { status: true },
  });

  if (!payment) {
    return NextResponse.json(
      { message: "Pembayaran tidak ditemukan" },
      { status: 404 },
    );
  }

  const status =
    payment.status === "PENDING"
      ? ((await syncPaymentFromMayar(paymentId)) ?? payment.status)
      : payment.status;

  return NextResponse.json({ status });
};
