"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

type Entry = {
  name: string;
  cat: string;
  type: "in" | "out";
  amount: number;
};

const SEED: Entry[] = [
  { name: "Makan siang", cat: "Makanan & minuman", type: "out", amount: 25000 },
  { name: "Kopi", cat: "Makanan & minuman", type: "out", amount: 22000 },
  { name: "Bensin", cat: "Transportasi", type: "out", amount: 30000 },
];

const CHIPS = [
  "makan siang 25 ribu",
  "gajian 5 juta",
  "bensin 30rb",
  "kopi 22 ribu",
];

const fmt = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

const parse = (text: string): Entry | null => {
  const s = text.toLowerCase().trim();
  if (!s) return null;

  let amount: number | null = null;
  let matched = "";

  const unitMatch = /(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k)\b/.exec(s);
  if (unitMatch) {
    const value = parseFloat((unitMatch[1] ?? "0").replace(",", "."));
    const multiplier =
      unitMatch[2] === "juta" || unitMatch[2] === "jt" ? 1_000_000 : 1_000;
    amount = Math.round(value * multiplier);
    matched = unitMatch[0];
  } else {
    const plainMatch = /(\d{1,3}(?:\.\d{3})+|\d{4,})/.exec(s);
    if (plainMatch) {
      amount = parseInt((plainMatch[1] ?? "0").replace(/\./g, ""), 10);
      matched = plainMatch[0];
    }
  }

  if (!amount || amount <= 0) return null;

  const isIncome = /gaji|gajian|bonus|thr|pemasukan|honor|dapat transfer/.test(
    s,
  );
  let cat = "Lainnya";

  if (isIncome) cat = "Pemasukan";
  else if (
    /makan|minum|kopi|jajan|sarapan|bakso|nasi|ayam|boba|kafe|cafe|warung|snack|mie\b|geprek/.test(
      s,
    )
  )
    cat = "Makanan & minuman";
  else if (
    /bensin|ojek|gojek|grab|parkir|\btol\b|krl|kereta|\bbus\b|angkot|transport/.test(
      s,
    )
  )
    cat = "Transportasi";
  else if (/listrik|pulsa|internet|wifi|tagihan|\bkos\b|sewa|cicilan/.test(s))
    cat = "Tagihan";
  else if (/nonton|bioskop|game|netflix|spotify|hiburan/.test(s))
    cat = "Hiburan";
  else if (/belanja|beli|indomaret|alfamart|baju|shopee|tokopedia/.test(s))
    cat = "Belanja";

  let name = s
    .replace(matched, " ")
    .replace(/\brp\.?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) name = isIncome ? "Pemasukan" : cat;
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return { name, cat, type: isIncome ? "in" : "out", amount };
};

const HeroSection = () => {
  const [entries, setEntries] = useState<Entry[]>(SEED);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [seq, setSeq] = useState(0);

  const add = (text: string) => {
    const entry = parse(text);
    if (!entry) {
      setMessage(
        "Nominalnya belum terbaca. Coba tulis seperti \u201ckopi 22 ribu\u201d atau \u201cgajian 5 juta\u201d.",
      );
      return;
    }
    setMessage("");
    setEntries((previous) => [entry, ...previous].slice(0, 5));
    setSeq((value) => value + 1);
    setInput("");
  };

  const reset = () => {
    setEntries(SEED);
    setSeq(0);
    setMessage("");
    setInput("");
  };

  const latest = entries[0];
  const others = entries.slice(1);

  let totalOut = 0;
  let totalIn = 0;
  const byCategory = new Map<string, number>();

  entries.forEach((entry) => {
    if (entry.type === "in") {
      totalIn += entry.amount;
      return;
    }
    totalOut += entry.amount;
    byCategory.set(entry.cat, (byCategory.get(entry.cat) ?? 0) + entry.amount);
  });

  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = categories[0]?.[1] ?? 1;

  const sign = (entry: Entry) =>
    `${entry.type === "in" ? "+" : "\u2212"}${fmt(entry.amount)}`;

  return (
    <section className="hero" id="hero">
      <div className="wrap">
        <div className="hero-copy">
          <div className="eyebrow">Pencatat keuangan pribadi berbasis AI</div>
          <h1>
            Lupa catat pengeluaran? Cukup ucapkan,{" "}
            <span className="hl">AI yang mencatat.</span>
          </h1>
          <p className="lead">
            Uang Pintar AI mencatat pemasukan dan pengeluaranmu dari suara atau
            ketikan, memilihkan kategorinya, lalu merekapnya. Kamu tinggal
            melihat ke mana uangmu pergi.
          </p>
          <div className="cta-row">
            <Link className="btn primary" href="/login">
              Coba Gratis
            </Link>
            <a className="btn ghost" href="#paket">
              Lihat paket
            </a>
          </div>
          <p className="fine">
            Gratis tanpa batas waktu untuk 20 transaksi per bulan. Tanpa kartu
            kredit.
          </p>
        </div>

        <div className="demo-col">
          <div className="demo-wrap on-dark">
            <div className="phone float">
              <div className="phone-top">
                <span>Coba catat sendiri</span>
                <span>Uang Pintar AI</span>
              </div>
              <form
                className="demo-form"
                autoComplete="off"
                onSubmit={(event) => {
                  event.preventDefault();
                  add(input);
                }}
              >
                <label
                  htmlFor="demoInput"
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Ketik transaksi, misalnya kopi 22 ribu
                </label>
                <input
                  id="demoInput"
                  type="text"
                  placeholder="Ketik: kopi 22 ribu"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setMessage("");
                  }}
                />
                <button type="submit" aria-label="Catat transaksi">
                  <Plus />
                </button>
              </form>
              <div className="chips">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="chip"
                    onClick={() => add(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <p className="demo-msg" role="status">
                {message}
              </p>

              {latest && (
                <div key={seq} className={`latest${seq > 0 ? " pop" : ""}`}>
                  <div className="ok">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
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
                    Tercatat
                  </div>
                  <div className="row">
                    <div>
                      <div className="nm">{latest.name}</div>
                      <div className="meta">
                        {latest.type === "in" ? "Pemasukan" : "Pengeluaran"} ·{" "}
                        {latest.cat}
                      </div>
                    </div>
                    <div className={`amt${latest.type === "in" ? " in" : ""}`}>
                      {sign(latest)}
                    </div>
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div className="rest">
                  {others.map((entry, index) => (
                    <div
                      key={`${entry.name}-${index}`}
                      className={`r${entry.type === "in" ? " in" : ""}`}
                    >
                      <span>{entry.name}</span>
                      <span style={{ fontWeight: 700 }}>{sign(entry)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="totals">
                <span>Pengeluaran</span>
                <strong>{fmt(totalOut)}</strong>
              </div>
              {totalIn > 0 && (
                <div className="totals">
                  <span>Pemasukan</span>
                  <strong className="in">{fmt(totalIn)}</strong>
                </div>
              )}

              {categories.length > 0 && (
                <div className="bars" aria-label="Pengeluaran per kategori">
                  {categories.map(([category, amount]) => (
                    <div className="b" key={category}>
                      <span>{category}</span>
                      <span className="track">
                        <i
                          style={{
                            width: `${Math.round(
                              (amount / maxCategory) * 100,
                            )}%`,
                          }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="demo-note">
              Simulasi sederhana di browser. Tidak disimpan dan bukan AI
              sungguhan.
            </div>
            <div className="center">
              <button type="button" className="linkbtn" onClick={reset}>
                Ulangi contoh
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
