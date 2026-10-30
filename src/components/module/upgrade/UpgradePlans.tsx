"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Check, Crown } from "lucide-react";
import CheckoutForm from "@/components/module/checkout/CheckoutForm";
import PaymentDialog from "@/components/module/checkout/PaymentDialog";
import PricingCards from "@/components/module/pricing/PricingCards";
import { PLANS, type PlanId, type PlanPrices } from "@/const/payment";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Props = {
  initialPlan: PlanId | null;
  availablePlans: PlanId[];
  activePlan: PlanId | null;
  name: string;
  email: string;
  prices: PlanPrices;
};

const UpgradePlans = ({
  initialPlan,
  availablePlans,
  activePlan,
  name,
  email,
  prices,
}: Props) => {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<1 | 2>(initialPlan ? 2 : 1);
  const [planId, setPlanId] = useState<PlanId | null>(initialPlan);
  const [link, setLink] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const plan = planId ? PLANS[planId] : null;

  useEffect(() => {
    if (!link || !paymentId) return;

    let active = true;

    const check = async () => {
      try {
        const response = await fetch(
          `/api/mayar/status?paymentId=${encodeURIComponent(paymentId)}`,
        );
        const data = (await response.json().catch(() => null)) as {
          status?: string;
        } | null;

        if (!active || data?.status !== "PAID") return;

        active = false;
        await update();
        setLink(null);
        setPaymentId(null);
        setPlanId(null);
        setStep(1);
        router.refresh();
        toastSuccess("Pembayaran berhasil", "Paket kamu sudah aktif.");
      } catch {
        // coba lagi pada interval berikutnya
      }
    };

    void check();
    const interval = setInterval(check, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [link, paymentId, update, router]);

  const note =
    activePlan === "pemula_monthly" && availablePlans.includes("pemula_yearly")
      ? "Paket Pemula Bulanan kamu masih aktif. Kamu bisa upgrade ke Pemula Tahunan atau Paket Jago."
      : activePlan === "pemula_yearly" &&
          availablePlans.includes("jago_lifetime")
        ? "Paket Pemula Tahunan kamu masih aktif. Kamu bisa upgrade ke Paket Jago."
        : null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dl-foreground">Upgrade Paket</h1>
        <p className="mt-1 text-sm text-dl-muted">
          Pilih paket yang ingin kamu aktifkan, lalu lanjutkan pembayaran.
        </p>
      </div>

      {note && (
        <p className="mt-4 rounded-2xl border border-dl-primary/15 bg-dl-cream/60 px-4 py-3 text-sm text-dl-primary">
          {note}
        </p>
      )}

      {availablePlans.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dl-border bg-white p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/25">
            <Crown className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-dl-foreground">
            Kamu sudah di Paket Jago
          </h2>
          <p className="mt-1 text-sm text-dl-muted">
            Paket Jago berlaku selamanya. Tidak ada paket yang perlu di-upgrade
            lagi.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dl-border/70 bg-dl-cream/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-xs font-bold text-white shadow-sm shadow-dl-primary/25">
                {step > 1 ? <Check className="size-4" /> : "1"}
              </span>
              <span className="text-xs font-semibold text-dl-foreground">
                Pilih Paket
              </span>
            </div>

            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-dl-border/70">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary transition-all duration-500",
                  step === 2 ? "w-full" : "w-0",
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  step === 2
                    ? "bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-sm shadow-dl-primary/25"
                    : "border border-dl-border bg-white text-dl-muted",
                )}
              >
                2
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  step === 2 ? "text-dl-foreground" : "text-dl-muted",
                )}
              >
                Ringkasan
              </span>
            </div>
          </div>

          {step === 1 ? (
            <div className="mt-6">
              <PricingCards
                availablePlans={availablePlans}
                selectedPlan={planId}
                prices={prices}
                showFree={false}
                flush
                onSelect={(id) => {
                  setPlanId(id);
                  setStep(2);
                }}
              />
            </div>
          ) : (
            plan && (
              <div className="mx-auto mt-6 max-w-md">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-dl-muted transition-colors hover:text-dl-primary"
                >
                  <ArrowLeft className="size-4" />
                  Ubah paket
                </button>

                <div className="rounded-3xl border border-dl-border bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-bold text-dl-foreground">
                    Ringkasan Pembayaran
                  </h2>
                  <div className="mt-4">
                    <CheckoutForm
                      embedded
                      planId={plan.id}
                      planName={plan.name}
                      period={plan.period}
                      amount={prices[plan.id]}
                      name={name}
                      email={email}
                      onInvoiceLink={(nextLink, nextPaymentId) => {
                        setLink(nextLink);
                        setPaymentId(nextPaymentId ?? null);
                      }}
                      onSkipped={() => {
                        void (async () => {
                          await update();
                          toastSuccess(
                            "Pembayaran dilewati",
                            "Paket langsung aktif (mode development).",
                          );
                          router.refresh();
                          router.push("/user/dashboard");
                        })();
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </>
      )}

      <PaymentDialog
        link={link}
        onClose={() => {
          setLink(null);
          setPaymentId(null);
        }}
      />
    </div>
  );
};

export default UpgradePlans;
