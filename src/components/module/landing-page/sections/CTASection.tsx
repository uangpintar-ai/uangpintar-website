"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const CTASection = () => {
  const router = useRouter();

  return (
    <section className="urgent">
      <div className="wrap">
        <div
          className="eyebrow"
          style={{ color: "var(--teal-900)", fontWeight: 800 }}
        >
          Promo Founder
        </div>
        <h2>Lifetime Rp249.000, hanya untuk 50 pengguna pertama.</h2>
        <p className="p">
          Setelah 50 slot terisi, Paket Jago menjadi Rp299.000 per tahun dan
          opsi lifetime ditutup. Bayar sekali sekarang, tanpa tagihan bulanan.
        </p>
        <div className="slots">Sisa [XX] dari 50 slot</div>
        <div className="row">
          <button
            type="button"
            className="btn dark pulse"
            onClick={() => {
              router.push("/checkout?plan=jago_lifetime");
            }}
          >
            Ambil Promo Founder
          </button>
          <Link className="btn ghost-dark" href="/login">
            Mulai gratis dulu
          </Link>
        </div>
        <p className="small">
          [KEBIJAKAN REFUND: mis. pengembalian dana dalam N hari]
        </p>
      </div>
    </section>
  );
};

export default CTASection;
