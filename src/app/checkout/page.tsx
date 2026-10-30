import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { isPlanId } from "@/const/payment";
import { getPlanPrices } from "@/server/services/plan-price";
import PurchaseCheckout from "@/components/module/checkout/PurchaseCheckout";

export const metadata: Metadata = {
  title: "Checkout Paket | Uang Pintar AI",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

const CheckoutPage = async ({ searchParams }: Props) => {
  const { plan } = await searchParams;
  const initialPlan = isPlanId(plan) ? plan : "pemula_yearly";

  const session = await getServerSession(authOptions);

  if (session?.user.userId) {
    redirect(`/user/upgrade?plan=${initialPlan}`);
  }

  return (
    <PurchaseCheckout initialPlan={initialPlan} prices={getPlanPrices()} />
  );
};

export default CheckoutPage;
