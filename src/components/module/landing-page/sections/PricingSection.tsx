"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PricingCards from "@/components/module/pricing/PricingCards";
import type { PlanId, PlanPrices } from "@/const/payment";

const fmt = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

type Props = {
  prices: PlanPrices;
};

const PricingSection = ({ prices }: Props) => {
  const router = useRouter();
  const [months, setMonths] = useState(12);

  const monthlyAmount = prices.pemula_monthly;
  const yearlyAmount = prices.pemula_yearly;
  const jagoAmount = prices.jago_lifetime;
  const jagoAfterPromoAmount = prices.jagoAfterPromo;

  const costRows = [
    {
      key: "pm",
      label: "Pemula bulanan",
      sub: `${fmt(monthlyAmount)} per bulan`,
      fn: (values: number) => monthlyAmount * values,
    },
    {
      key: "py",
      label: "Pemula tahunan",
      sub: `${fmt(yearlyAmount)} per 12 bulan`,
      fn: (values: number) => yearlyAmount * Math.ceil(values / 12),
    },
    {
      key: "jl",
      label: "Jago lifetime (promo)",
      sub: `${fmt(jagoAmount)} sekali bayar`,
      fn: (_values: number) => jagoAmount,
    },
    {
      key: "jy",
      label: "Jago setelah promo",
      sub: `${fmt(jagoAfterPromoAmount)} per tahun`,
      fn: (values: number) => jagoAfterPromoAmount * Math.ceil(values / 12),
    },
  ];

  const selectPlan = (planId: PlanId) => {
    router.push(`/checkout?plan=${planId}`);
  };

  const values = costRows.map((row) => row.fn(months));
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <>
      <section className="packs pad" id="paket">
        <div className="wrap">
          <div
            style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}
          >
            <div className="eyebrow">Paket</div>
            <h2 className="title">
              Mulai gratis. Naik paket kalau sudah terasa manfaatnya.
            </h2>
          </div>

          <PricingCards reveal onSelect={selectPlan} prices={prices} />

          <div className="calc reveal">
            <h3>Berapa total biayanya kalau kamu pakai lama?</h3>
            <p className="hint">
              Geser untuk melihat total biaya kumulatif dari harga yang tertera
              di halaman ini. Fitur tiap paket berbeda, jadi ini hanya
              perbandingan biaya, bukan rekomendasi paket.
            </p>
            <div className="slider-row">
              <label htmlFor="months">Lama pemakaian</label>
              <input
                type="range"
                id="months"
                min="1"
                max="36"
                step="1"
                value={months}
                onChange={(event) =>
                  setMonths(parseInt(event.target.value, 10))
                }
              />
              <output htmlFor="months">{months} bulan</output>
            </div>
            <div className="cbars" role="list">
              {costRows.map((row, index) => {
                const value = values[index] ?? 0;
                const best = value === min;
                return (
                  <div
                    className={`cb${best ? " best" : ""}`}
                    role="listitem"
                    key={row.key}
                  >
                    <div className="lbl">
                      {row.label}
                      <small>{row.sub}</small>
                    </div>
                    <div className="track">
                      <i
                        style={{
                          width: `${Math.max(4, Math.round((value / max) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="val">
                      {fmt(value)}
                      {best && <span className="star">Termurah</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="cnote">
              Asumsi hitungan: Pemula bulanan {fmt(monthlyAmount)} per bulan.
              Pemula tahunan {fmt(yearlyAmount)} per 12 bulan, dibayar di muka.
              Jago lifetime {fmt(jagoAmount)} sekali bayar selama promo 50 slot,
              setelah itu {fmt(jagoAfterPromoAmount)} per tahun. Harga dan promo
              bisa berubah.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection;
