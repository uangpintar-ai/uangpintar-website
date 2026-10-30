"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PricingCards from "@/components/module/pricing/PricingCards";
import type { PlanId } from "@/const/payment";

const fmt = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

const costRows = [
  {
    key: "pm",
    label: "Pemula bulanan",
    sub: "Rp20.000 per bulan",
    fn: (months: number) => 20000 * months,
  },
  {
    key: "py",
    label: "Pemula tahunan",
    sub: "Rp199.000 per 12 bulan",
    fn: (months: number) => 199000 * Math.ceil(months / 12),
  },
  {
    key: "jl",
    label: "Jago lifetime (promo)",
    sub: "Rp249.000 sekali bayar",
    fn: (_months: number) => 249000,
  },
  {
    key: "jy",
    label: "Jago setelah promo",
    sub: "Rp299.000 per tahun",
    fn: (months: number) => 299000 * Math.ceil(months / 12),
  },
];

const PricingSection = () => {
  const router = useRouter();
  const [months, setMonths] = useState(12);

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

          <PricingCards reveal onSelect={selectPlan} />

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
              Asumsi hitungan: Pemula bulanan Rp20.000 per bulan. Pemula tahunan
              Rp199.000 per 12 bulan, dibayar di muka. Jago lifetime Rp249.000
              sekali bayar selama promo 50 slot, setelah itu Rp299.000 per
              tahun. Harga dan promo bisa berubah.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection;
