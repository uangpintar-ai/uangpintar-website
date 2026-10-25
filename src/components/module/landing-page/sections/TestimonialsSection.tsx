const testimonials = [
  {
    quote:
      "Dulu tiap akhir bulan saya bingung uang habis ke mana. Sekarang tinggal ketik \u201cmakan siang 25 ribu\u201d, langsung tercatat dan masuk kategori. Sisa saldo juga kelihatan.",
    result:
      "Rutin mencatat 30 hari berturut-turut tanpa buka mobile banking satu per satu.",
    name: "Rani Anggraini",
    initials: "RA",
    meta: "28 tahun \u00b7 Karyawan swasta \u00b7 Bandung \u00b7 Paket Pemula Bulanan",
  },
  {
    quote:
      "Paling ngebantu waktu lagi buru-buru. Saya tinggal ucapkan pengeluarannya, AI yang catat dan pilihkan kategorinya. Rekap mingguan jadi bahan evaluasi tanpa hitung manual.",
    result: "Tahu kategori terboros dalam seminggu pertama pemakaian.",
    name: "Dimas Prakoso",
    initials: "DP",
    meta: "32 tahun \u00b7 Pemilik warung kopi \u00b7 Surabaya \u00b7 Paket Pemula Tahunan",
  },
  {
    quote:
      "Sudah coba beberapa aplikasi catatan, tapi selalu berhenti di tengah jalan. Uang Pintar lebih simpel karena bisa dicatat lewat suara dan langsung masuk dashboard.",
    result: "Berhenti lupa mencatat setelah 14 hari pemakaian.",
    name: "Sari Wulandari",
    initials: "SW",
    meta: "26 tahun \u00b7 Desainer freelance \u00b7 Jakarta \u00b7 Paket Jago",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="testi pad" id="cerita">
      <div className="wrap">
        <div style={{ maxWidth: "680px" }}>
          <div className="eyebrow">Cerita pengguna</div>
          <h2 className="title">
            Yang berubah bukan cuma catatannya, tapi cara mereka melihat uang.
          </h2>
        </div>
        <div className="tgrid">
          {testimonials.map((item) => (
            <figure className="tcard card reveal" key={item.name}>
              <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
              <div className="res">{item.result}</div>
              <figcaption>
                <span className="ph">{item.initials}</span>
                <span>
                  <strong>{item.name}</strong>
                  <br />
                  <span className="s">{item.meta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
