"use client";

import { useState } from "react";
import {
  Bell,
  Mic,
  PieChart,
  ReceiptText,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type PlanFilter = "all" | "belajar" | "pemula" | "jago";

type Benefit = {
  Icon: LucideIcon;
  title: string;
  body: string;
  tag: string;
  plans: PlanFilter[];
  jago: boolean;
};

const benefits: Benefit[] = [
  {
    Icon: Mic,
    title: "Catat tanpa buka banyak menu",
    body: "Cukup ucapkan atau ketik. Tidak perlu mengisi formulir setiap kali belanja.",
    tag: "Paket Pemula & Jago",
    plans: ["pemula", "jago"],
    jago: false,
  },
  {
    Icon: Tag,
    title: "Kategori terisi sendiri",
    body: "Makan, transportasi, tagihan. AI memilihkan kategorinya, kamu tidak perlu repot.",
    tag: "Paket Pemula & Jago",
    plans: ["pemula", "jago"],
    jago: false,
  },
  {
    Icon: ReceiptText,
    title: "Struk jadi catatan",
    body: "Foto struk belanja, AI membaca nominalnya dan memasukkannya ke catatanmu.",
    tag: "Paket Jago",
    plans: ["jago"],
    jago: true,
  },
  {
    Icon: Wallet,
    title: "Saldo dan riwayat dalam satu layar",
    body: "Lihat catatan harian, mingguan, dan bulanan, lengkap dengan total pemasukan, pengeluaran, dan sisa saldo.",
    tag: "Semua paket",
    plans: ["belajar", "pemula", "jago"],
    jago: false,
  },
  {
    Icon: PieChart,
    title: "Tahu pengeluaran terbesarmu",
    body: "Analisis AI menunjukkan pola pengeluaran, kategori terboros, dan perbandingan bulan ini dengan bulan lalu.",
    tag: "Paket Jago",
    plans: ["jago"],
    jago: true,
  },
  {
    Icon: Bell,
    title: "Tetap di jalur budget",
    body: "Atur budget per kategori dan dapat peringatan saat pemakaian mencapai 80% dan 100%.",
    tag: "Paket Pemula & Jago",
    plans: ["pemula", "jago"],
    jago: false,
  },
];

const filterNote: Record<PlanFilter, string> = {
  all: "",
  belajar: "Paket Belajar (gratis) mencakup 1 dari 6 manfaat di bawah.",
  pemula: "Paket Pemula mencakup 4 dari 6 manfaat di bawah.",
  jago: "Paket Jago mencakup semua 6 manfaat di bawah.",
};

const filters: { value: PlanFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "belajar", label: "Paket Belajar" },
  { value: "pemula", label: "Paket Pemula" },
  { value: "jago", label: "Paket Jago" },
];

const FeaturesSection = () => {
  const [filter, setFilter] = useState<PlanFilter>("all");

  return (
    <section className="pad" id="manfaat">
      <div className="wrap">
        <div style={{ maxWidth: "680px" }}>
          <div className="eyebrow">Manfaat</div>
          <h2 className="title">
            Dari &ldquo;lupa catat&rdquo; jadi &ldquo;tahu persis&rdquo;.
          </h2>
        </div>
        <div
          className="filters"
          role="group"
          aria-label="Lihat manfaat berdasarkan paket"
        >
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className="fbtn"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="fnote" role="status">
          {filterNote[filter]}
        </p>
        <div className="bgrid">
          {benefits.map((benefit) => {
            const dim = filter !== "all" && !benefit.plans.includes(filter);
            return (
              <div
                key={benefit.title}
                className={`bcard card reveal${dim ? " dim" : ""}`}
              >
                <div className="ico-box">
                  <benefit.Icon />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.body}</p>
                <span className={`tag${benefit.jago ? " jago" : ""}`}>
                  {benefit.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
