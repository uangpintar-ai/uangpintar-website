import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";

export const GET = async (request: Request) => {
  const paymentId = new URL(request.url).searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.json(
      { message: "Payment ID tidak valid" },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user.userId;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payment = await db.payment.findFirst({
    where: { id: paymentId, userId },
    select: { status: true },
  });

  if (!payment) {
    return NextResponse.json(
      { message: "Pembayaran tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: payment.status });
};
