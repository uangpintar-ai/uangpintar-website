const testimonials = [
  "[HASIL SPESIFIK, mis. rutin mencatat N minggu berturut-turut]",
  "[HASIL SPESIFIK, mis. tahu kategori pengeluaran terbesar dalam N hari]",
  "[HASIL SPESIFIK, mis. berhenti lupa mencatat setelah N hari]",
];

const TestimonialsSection = () => {
  return (
    <section className="testi pad" id="cerita">
      <div className="wrap">
        <div style={{ maxWidth: "680px" }}>
          <div className="eyebrow">Cerita pengguna</div>
          <h2 className="title">
            [JUDUL: hasil nyata yang dirasakan pengguna]
          </h2>
        </div>
        <div className="tgrid">
          {testimonials.map((result, index) => (
            <figure className="tcard card reveal" key={index}>
              <blockquote>
                &ldquo;[KUTIPAN 1&ndash;2 kalimat: situasi sebelum memakai Uang
                Pintar AI, lalu apa yang berubah.]&rdquo;
              </blockquote>
              <div className="res">{result}</div>
              <figcaption>
                <span className="ph">[FOTO]</span>
                <span>
                  <strong>[NAMA]</strong>
                  <br />
                  <span className="s">
                    [USIA / PROFESI / KOTA] &middot; Paket [NAMA PAKET]
                  </span>
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
