"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import CheckoutForm from "@/components/module/checkout/CheckoutForm";
import { PLANS, type PlanId } from "@/const/payment";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  initialPlan: PlanId;
  name: string;
  email: string;
};

const planIds: PlanId[] = ["pemula_monthly", "pemula_yearly", "jago_lifetime"];

const UpgradePlans = ({ initialPlan, name, email }: Props) => {
  const [planId, setPlanId] = useState<PlanId>(initialPlan);
  const plan = PLANS[planId];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dl-foreground">Upgrade Paket</h1>
        <p className="mt-1 text-sm text-dl-muted">
          Pilih paket yang ingin kamu aktifkan, lalu lanjutkan pembayaran.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {planIds.map((id) => {
            const option = PLANS[id];
            const selected = id === planId;

            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlanId(id)}
                className={cn(
                  "w-full rounded-2xl border bg-white p-5 text-left transition-all",
                  selected
                    ? "border-dl-primary ring-2 ring-dl-primary/10"
                    : "border-dl-border hover:border-dl-primary/40",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-dl-foreground">
                      {option.name}
                    </p>
                    <p className="text-sm text-dl-muted">{option.period}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-dl-foreground">
                      {formatCurrency(option.amount)}
                    </p>
                    {selected && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-dl-primary text-white">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-dl-muted">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="h-fit rounded-2xl border border-dl-border bg-white p-6">
          <h2 className="text-lg font-bold text-dl-foreground">Pembayaran</h2>
          <p className="mt-1 text-sm text-dl-muted">
            Pembayaran diproses melalui Mayar.
          </p>
          <div className="mt-4">
            <CheckoutForm
              embedded
              planId={plan.id}
              planName={plan.name}
              period={plan.period}
              amount={plan.amount}
              name={name}
              email={email}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlans;
