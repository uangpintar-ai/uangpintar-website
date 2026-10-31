import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { PLANS, isPlanId } from "@/const/payment";
import PaymentSuccess from "@/components/module/checkout/PaymentSuccess";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil | Uang Pintar AI",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{ paymentId?: string }>;
};

const PaymentSuccessPage = async ({ searchParams }: Props) => {
  const { paymentId } = await searchParams;

  if (!paymentId) {
    redirect("/checkout");
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      amount: true,
      plan: true,
      status: true,
      user: { select: { password: true } },
    },
  });

  if (!payment || payment.status !== "PAID") {
    redirect("/checkout");
  }

  const plan = isPlanId(payment.plan) ? PLANS[payment.plan] : null;

  return (
    <PaymentSuccess
      paymentId={paymentId}
      planName={plan?.name ?? "Paket Uang Pintar"}
      amount={payment.amount}
      hasPassword={Boolean(payment.user.password)}
    />
  );
};

export default PaymentSuccessPage;
