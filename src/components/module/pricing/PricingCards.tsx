"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlanId } from "@/const/payment";
import "@/components/module/landing-page/landing.css";

const allPlanIds: PlanId[] = [
  "pemula_monthly",
  "pemula_yearly",
  "jago_lifetime",
];

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
  [true, "Catat transaksi manual tanpa batas"],
  [true, "20x catat transaksi oleh AI per bulan"],
  [true, "Riwayat catatan harian, mingguan, dan bulanan"],
  [
    true,
    "Budget per jenis pengeluaran + peringatan saat pemakaian 80% dan 100%",
  ],
  [true, "Multi-dompet: tunai, bank, e-wallet, dan lainnya"],
  [true, "Total pemasukan, pengeluaran, dan sisa saldo dalam satu dashboard"],
  [true, "Gratis tanpa batas waktu, tanpa kartu kredit"],
  [false, "Catat transaksi lewat suara"],
  [false, "Foto struk otomatis (OCR)"],
  [false, "Analisis keuangan AI"],
];

const pemula: [boolean, string][] = [
  [true, "Catat transaksi manual tanpa batas"],
  [true, "300x catat transaksi oleh AI per bulan (suara atau ketik)"],
  [true, "Catat transaksi lewat suara"],
  [true, "Riwayat catatan harian, mingguan, dan bulanan"],
  [
    true,
    "Budget per jenis pengeluaran + peringatan saat pemakaian 80% dan 100%",
  ],
  [true, "Kategori pemasukan / pengeluaran otomatis oleh AI"],
  [true, "Multi-dompet: tunai, bank, e-wallet, dan lainnya"],
  [true, "Total pemasukan, pengeluaran, dan sisa saldo dalam satu dashboard"],
  [true, "Export data ke CSV/Excel"],
  [true, "Pilih bulanan atau tahunan, batalkan kapan saja"],
  [false, "Foto struk otomatis (OCR)"],
  [false, "Analisis keuangan AI"],
];

const jago = [
  "Catat transaksi manual tanpa batas",
  "500x catat transaksi oleh AI per bulan (suara atau ketik)",
  "Catat transaksi lewat suara",
  "Riwayat catatan harian, mingguan, dan bulanan",
  "Budget per jenis pengeluaran + peringatan saat pemakaian 80% dan 100%",
  "Kategori pemasukan / pengeluaran otomatis oleh AI",
  "Multi-dompet: tunai, bank, e-wallet, dan lainnya",
  "Total pemasukan, pengeluaran, dan sisa saldo dalam satu dashboard",
  "Export data ke CSV/Excel",
  "Foto struk otomatis (OCR)",
  "Analisis & insight keuangan AI: pola pengeluaran, kategori terboros, perbandingan bulan ini vs bulan lalu",
  "Akses lifetime selama layanan Uang Pintar beroperasi",
  "Bayar sekali, tanpa tagihan bulanan",
  "Akses lebih awal ke fitur baru",
  "Ikut voting fitur berikutnya",
  "Prioritas bantuan",
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

type Props = {
  availablePlans?: PlanId[];
  selectedPlan?: PlanId | null;
  onSelect: (planId: PlanId) => void;
  showFree?: boolean;
  flush?: boolean;
  reveal?: boolean;
};

const PricingCards = ({
  availablePlans = allPlanIds,
  selectedPlan,
  onSelect,
  showFree = true,
  flush = false,
  reveal = false,
}: Props) => {
  const monthlyAvailable = availablePlans.includes("pemula_monthly");
  const yearlyAvailable = availablePlans.includes("pemula_yearly");
  const pemulaAvailable = monthlyAvailable || yearlyAvailable;
  const jagoAvailable = availablePlans.includes("jago_lifetime");

  const [yearly, setYearly] = useState(
    selectedPlan === "pemula_yearly" && yearlyAvailable,
  );
  const isYearly = monthlyAvailable ? yearly : yearlyAvailable;
  const pemulaPlanId: PlanId = isYearly ? "pemula_yearly" : "pemula_monthly";
  const pemulaTitle = isYearly ? "Pemula Tahunan" : "Pemula Bulanan";

  return (
    <div className="up-landing pricing-cards">
      <div className={`pgrid${flush ? " flush" : ""}`}>
        {showFree && (
          <div className={`plan free card${reveal ? " reveal" : ""}`}>
            <h3>Gratis</h3>
            <p className="sub">Belajar catat, tanpa risiko.</p>
            <div className="price">
              <b>Gratis</b>
            </div>
            <div className="note">Tanpa batas waktu</div>
            <p className="desc">
              Baru mulai ngatur uang? Catat transaksi manual tanpa batas, atur
              budget per jenis pengeluaran, dan pantau sisa saldo di satu
              dashboard. Termasuk 20x catat transaksi oleh AI per bulan.
            </p>
            <Link className="btn ghost block cta" href="/register">
              Daftar Gratis
            </Link>
            <List items={belajar} />
          </div>
        )}

        {pemulaAvailable && (
          <div className={`plan mid card${reveal ? " reveal" : ""}`}>
            <h3>{pemulaTitle}</h3>
            <p className="sub">Rajin catat, tinggal ngomong.</p>
            {monthlyAvailable && yearlyAvailable && (
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
            )}
            <div className="price" style={{ marginTop: "16px" }}>
              <b>{isYearly ? "Rp199.000" : "Rp20.000"}</b>
              <span className="unit">{isYearly ? "/tahun" : "/bulan"}</span>
            </div>
            <div className="note">
              {isYearly
                ? "Ditagih Rp199.000 untuk 12 bulan"
                : "Atau Rp199.000/tahun"}
            </div>
            <p className="desc">
              Waktunya serius. Catat manual tanpa batas plus 300x catat
              transaksi oleh AI per bulan: cukup ketik atau ucapkan &ldquo;makan
              siang 25 ribu&rdquo;, langsung tercatat dan masuk kategori yang
              tepat.
            </p>
            <button
              type="button"
              className="btn primary block cta"
              onClick={() => onSelect(pemulaPlanId)}
            >
              Pilih {pemulaTitle}
            </button>
            <List items={pemula} />
          </div>
        )}

        {jagoAvailable && (
          <div className={`plan top card on-dark${reveal ? " reveal" : ""}`}>
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
              Paket Pemula dengan 500x catat transaksi oleh AI per bulan,
              ditambah foto struk yang dibaca otomatis dan analisis keuangan AI
              yang menunjukkan ke mana uangmu bocor.
            </p>
            <button
              type="button"
              className="btn lime block cta"
              onClick={() => onSelect("jago_lifetime")}
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
              Analisis AI berupa informasi umum dari data yang kamu catat, bukan
              nasihat keuangan atau investasi profesional.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingCards;
