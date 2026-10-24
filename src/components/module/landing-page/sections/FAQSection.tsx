import { ChevronDown } from "lucide-react";

const faq: [string, string][] = [
  [
    "Apa itu Uang Pintar AI?",
    "Aplikasi pencatat keuangan pribadi. Kamu bisa mencatat pemasukan dan pengeluaran secara manual, atau lewat AI dengan mengucapkan atau mengetik transaksimu.",
  ],
  [
    "Bagaimana cara mencatat dengan AI?",
    "Ucapkan atau ketik seperti biasa, misalnya \u201cbeli bensin 30 ribu\u201d. AI membaca nominal dan jenis transaksinya, lalu mencatatnya untukmu. Pencatatan lewat suara tersedia di Paket Pemula dan Paket Jago.",
  ],
  [
    "Apa bedanya Paket Belajar, Pemula, dan Jago?",
    "Belajar gratis dengan 20 transaksi per bulan. Pemula membuka catat manual tanpa batas, 150 catatan AI per bulan, dan pencatatan lewat suara. Jago menambah kuota menjadi 500 catatan AI per bulan, foto struk otomatis, dan analisis keuangan AI.",
  ],
  [
    "Bagaimana kalau kuota catatan AI habis?",
    "Catat manual tetap bisa dipakai tanpa batas di Paket Pemula dan Jago. Kuota AI diperbarui setiap bulan. Di Paket Belajar, batasnya 20 transaksi per bulan.",
  ],
  [
    "Apa arti \u201clifetime\u201d di Paket Jago?",
    "Kamu membayar sekali dan tidak ada tagihan bulanan. Aksesnya berlaku selama layanan Uang Pintar beroperasi. Harga lifetime hanya untuk 50 pengguna pertama; setelah itu Paket Jago Rp299.000 per tahun.",
  ],
  [
    "Apakah data keuanganku aman?",
    "[ISI sesuai kebijakan privasi: bagaimana data disimpan dan dilindungi, apakah data dikirim ke penyedia AI, dan cara menghapus data.] Baca Kebijakan Privasi lengkap di [LINK].",
  ],
  [
    "Apakah analisis AI sama dengan nasihat keuangan?",
    "Bukan. Analisis AI berupa informasi umum dari data yang kamu catat, bukan nasihat keuangan atau investasi profesional.",
  ],
  [
    "Bagaimana pembayaran, dan kalau ternyata tidak cocok?",
    "Pembayaran lewat Mayar [sesuaikan metode yang diaktifkan, mis. QRIS, e-wallet, transfer bank]. Kebijakan pengembalian dana: [ISI kebijakan refund].",
  ],
];

const FAQSection = () => {
  return (
    <section className="faq pad" id="faq">
      <div className="in">
        <div className="eyebrow">FAQ</div>
        <h2 className="title">Pertanyaan yang sering ditanyakan</h2>
        <div className="faq-list">
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                <span>{question}</span>
                <span className="chev">
                  <ChevronDown />
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
