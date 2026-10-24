"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSession } from "next-auth/react";
import PurchaseModal from "@/components/module/checkout/PurchaseModal";
import type { PlanId } from "@/const/payment";

const fmt = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

const CheckOn = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="var(--teal-700)" />
    <path
      d="M5.5 10.5l3 3 6-6.5"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckLime = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="var(--lime)" />
    <path
      d="M5.5 10.5l3 3 6-6.5"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Cross = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle
      cx="10"
      cy="10"
      r="9"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="1.6"
    />
    <path
      d="M7 7l6 6M13 7l-6 6"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const belajar: [boolean, string][] = [
  [true, "20 transaksi per bulan"],
  [true, "Riwayat catatan harian, mingguan, dan bulanan"],
  [true, "Total pemasukan, pengeluaran, dan sisa saldo dalam satu dashboard"],
  [true, "Kategori dasar"],
  [true, "Gratis tanpa batas waktu, tanpa kartu kredit"],
  [false, "Catat lewat suara"],
  [false, "Foto struk otomatis"],
  [false, "Analisis keuangan AI"],
];

const pemula: [boolean, string][] = [
  [true, "Catat manual tanpa batas"],
  [true, "150 catatan AI per bulan (suara atau ketik)"],
  [true, "Catat lewat suara"],
  [true, "Kategori otomatis oleh AI"],
  [true, "Riwayat dan dashboard lengkap: pemasukan, pengeluaran, sisa saldo"],
  [true, "Budget per kategori + peringatan saat pemakaian 80% dan 100%"],
  [true, "Multi-dompet: tunai, bank, e-wallet"],
  [true, "Rekap mingguan dan bulanan otomatis"],
  [true, "Pengingat catat harian"],
  [true, "Export data ke CSV/Excel"],
  [true, "Pilih bulanan atau tahunan, batalkan kapan saja"],
  [false, "Foto struk otomatis (OCR)"],
  [false, "Analisis keuangan AI"],
];

const jago = [
  "Semua fitur Paket Pemula",
  "500 catatan AI per bulan (suara atau ketik)",
  "Foto struk belanja otomatis dibaca (OCR)",
  "Analisis & insight keuangan AI: pola pengeluaran, kategori terboros, perbandingan bulan ini vs bulan lalu",
  "Tanya AI soal keuanganmu, misalnya \u201cbulan ini paling boros di mana?\u201d (30\u00d7 per bulan)",
  "Akses lifetime selama layanan Uang Pintar beroperasi",
  "Bayar sekali, tanpa tagihan bulanan",
  "Akses lebih awal ke fitur baru",
  "Ikut voting fitur berikutnya",
  "Prioritas bantuan",
];

const costRows = [
  {
    key: "pm",
    label: "Pemula bulanan",
    sub: "Rp1.000 per bulan",
    fn: (months: number) => 1000 * months,
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

const List = ({ items }: { items: [boolean, string][] }) => (
  <ul>
    {items.map(([included, label]) => (
      <li key={label} className={included ? undefined : "no"}>
        {included ? <CheckOn /> : <Cross />}
        <span>{label}</span>
      </li>
    ))}
  </ul>
);

const PricingSection = () => {
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [months, setMonths] = useState(12);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);

  const selectPlan = async (planId: PlanId) => {
    const session = await getSession().catch(() => null);

    if (session) {
      router.push(`/user/upgrade?plan=${planId}`);
      return;
    }

    setCheckoutPlan(planId);
  };

  const pemulaPrice = yearly
    ? {
        price: "Rp199.000",
        unit: "/tahun",
        note: "Ditagih Rp199.000 untuk 12 bulan",
      }
    : {
        price: "Rp1.000",
        unit: "/bulan",
        note: "Atau Rp199.000/tahun",
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

          <div className="pgrid">
            <div className="plan free card reveal">
              <h3>Paket Belajar</h3>
              <p className="sub">Belajar catat, tanpa risiko.</p>
              <div className="price">
                <b>Gratis</b>
              </div>
              <div className="note">Tanpa batas waktu</div>
              <p className="desc">
                Baru mulai ngatur uang? Mulai dari sini. Catat pemasukan dan
                pengeluaranmu, lihat sisa saldo, dan rasakan bedanya kalau
                semuanya rapi.
              </p>
              <Link className="btn ghost block cta" href="/register">
                Daftar Gratis
              </Link>
              <List items={belajar} />
            </div>

            <div className="plan mid card reveal">
              <h3>Paket Pemula</h3>
              <p className="sub">Rajin catat, tanpa dibatasi.</p>
              <div
                className="seg"
                role="group"
                aria-label="Pilih periode tagihan"
              >
                <button
                  type="button"
                  aria-pressed={!yearly}
                  onClick={() => setYearly(false)}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  aria-pressed={yearly}
                  onClick={() => setYearly(true)}
                >
                  Tahunan
                </button>
              </div>
              <div className="price" style={{ marginTop: "16px" }}>
                <b>{pemulaPrice.price}</b>
                <span className="unit">{pemulaPrice.unit}</span>
              </div>
              <div className="note">{pemulaPrice.note}</div>
              <p className="desc">
                Waktunya serius. Catat semua secara manual tanpa batas, dan
                biarkan AI yang kerja: cukup ketik atau ucapkan &ldquo;makan
                siang 25 ribu&rdquo;, langsung tercatat dan masuk kategori yang
                tepat.
              </p>
              <button
                type="button"
                className="btn primary block cta"
                onClick={() => {
                  void selectPlan(yearly ? "pemula_yearly" : "pemula_monthly");
                }}
              >
                Pilih Paket Pemula
              </button>
              <List items={pemula} />
            </div>

            <div className="plan top card reveal on-dark">
              <span className="badge">
                Promo Founder &middot; 50 pengguna pertama
              </span>
              <h3>Paket Jago</h3>
              <p className="sub">Bayar sekali. Uangmu terkendali.</p>
              <div className="price">
                <b>Rp249.000</b>
                <span className="unit">sekali bayar</span>
              </div>
              <div className="note">
                Akses lifetime. Setelah promo: Rp299.000/tahun, tanpa opsi
                lifetime.
              </div>
              <p className="desc">
                Untuk kamu yang mau uangnya benar-benar terkendali. Semua fitur
                Paket Pemula, kuota AI lebih besar, ditambah foto struk yang
                dibaca otomatis dan analisis keuangan AI yang menunjukkan ke
                mana uangmu bocor.
              </p>
              <button
                type="button"
                className="btn lime block cta"
                onClick={() => {
                  void selectPlan("jago_lifetime");
                }}
              >
                Ambil Promo Founder
              </button>
              <ul>
                {jago.map((label) => (
                  <li key={label}>
                    <CheckLime />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <p className="legal">
                Analisis AI berupa informasi umum dari data yang kamu catat,
                bukan nasihat keuangan atau investasi profesional.
              </p>
            </div>
          </div>

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
              Asumsi hitungan: Pemula bulanan Rp1.000 per bulan. Pemula tahunan
              Rp199.000 per 12 bulan, dibayar di muka. Jago lifetime Rp249.000
              sekali bayar selama promo 50 slot, setelah itu Rp299.000 per
              tahun. Harga dan promo bisa berubah.
            </p>
          </div>
        </div>
      </section>
      <PurchaseModal
        planId={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
      />
    </>
  );
};

export default PricingSection;
