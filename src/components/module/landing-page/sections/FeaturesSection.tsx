import {
  Bell,
  Mic,
  PieChart,
  ReceiptText,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Benefit = {
  Icon: LucideIcon;
  title: string;
  body: string;
  tag: string;
  jago: boolean;
};

const benefits: Benefit[] = [
  {
    Icon: Mic,
    title: "Catat tanpa buka banyak menu",
    body: "Cukup ucapkan atau ketik. Tidak perlu mengisi formulir setiap kali belanja.",
    tag: "Paket Pemula & Jago",
    jago: false,
  },
  {
    Icon: Tag,
    title: "Kategori terisi sendiri",
    body: "Makan, transportasi, tagihan. AI memilihkan kategorinya, kamu tidak perlu repot.",
    tag: "Paket Pemula & Jago",
    jago: false,
  },
  {
    Icon: ReceiptText,
    title: "Struk jadi catatan",
    body: "Foto struk belanja, AI membaca nominalnya dan memasukkannya ke catatanmu.",
    tag: "Paket Jago",
    jago: true,
  },
  {
    Icon: Wallet,
    title: "Saldo dan riwayat dalam satu layar",
    body: "Lihat catatan harian, mingguan, dan bulanan, lengkap dengan total pemasukan, pengeluaran, dan sisa saldo.",
    tag: "Semua paket",
    jago: false,
  },
  {
    Icon: PieChart,
    title: "Tahu pengeluaran terbesarmu",
    body: "Analisis AI menunjukkan pola pengeluaran, kategori terboros, dan perbandingan bulan ini dengan bulan lalu.",
    tag: "Paket Jago",
    jago: true,
  },
  {
    Icon: Bell,
    title: "Tetap di jalur budget",
    body: "Atur budget per kategori dan dapat peringatan saat pemakaian mencapai 80% dan 100%.",
    tag: "Semua paket",
    jago: false,
  },
];

const FeaturesSection = () => {
  return (
    <section className="pad" id="manfaat">
      <div className="wrap">
        <div style={{ maxWidth: "680px" }}>
          <div className="eyebrow">Manfaat</div>
          <h2 className="title">
            Dari &ldquo;lupa catat&rdquo; jadi &ldquo;tahu persis&rdquo;.
          </h2>
        </div>
        <div className="bgrid">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bcard card reveal">
              <div className="ico-box">
                <benefit.Icon />
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
              <span className={`tag${benefit.jago ? " jago" : ""}`}>
                {benefit.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
