import Link from "next/link";

const B1 = (
  <svg
    width="160"
    height="96"
    viewBox="0 0 160 96"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="62" y="12" width="36" height="52" rx="18" fill="var(--lime)" />
    <path
      d="M50 44v4a30 30 0 0 0 60 0v-4M80 78v10"
      fill="none"
      stroke="#fff"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <g fill="var(--soft)">
      <rect className="up-bar" x="20" y="32" width="6" height="22" rx="3" />
      <rect
        className="up-bar"
        x="32"
        y="22"
        width="6"
        height="42"
        rx="3"
        style={{ animationDelay: ".2s" }}
      />
      <rect
        className="up-bar"
        x="44"
        y="30"
        width="6"
        height="26"
        rx="3"
        style={{ animationDelay: ".4s" }}
      />
      <rect
        className="up-bar"
        x="110"
        y="30"
        width="6"
        height="26"
        rx="3"
        style={{ animationDelay: ".3s" }}
      />
      <rect
        className="up-bar"
        x="122"
        y="22"
        width="6"
        height="42"
        rx="3"
        style={{ animationDelay: ".5s" }}
      />
      <rect
        className="up-bar"
        x="134"
        y="32"
        width="6"
        height="22"
        rx="3"
        style={{ animationDelay: ".1s" }}
      />
    </g>
  </svg>
);

const B2 = (
  <svg
    width="160"
    height="96"
    viewBox="0 0 160 96"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M14 24a13 13 0 0 1 13-13h28a13 13 0 0 1 13 13v6a13 13 0 0 1-13 13H34l-12 9 2-10a13 13 0 0 1-10-12z"
      fill="var(--lime)"
    />
    <path
      d="M26 27h28M26 35h16"
      stroke="var(--teal-900)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M72 36h14M81 30l6 6-6 6"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M78 8l2.4 5.6 5.6 2.4-5.6 2.4L78 24l-2.4-5.6L70 16l5.6-2.4z"
      fill="var(--lime)"
    />
    <rect x="96" y="16" width="52" height="46" rx="10" fill="#fff" />
    <circle cx="108" cy="29" r="6" fill="var(--teal-700)" />
    <path
      d="M105.2 29.2l2 2 3.6-4"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M118 27h22M118 33h14"
      stroke="var(--muted)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <rect x="104" y="44" width="30" height="10" rx="5" fill="var(--lime)" />
  </svg>
);

const B3 = (
  <svg
    width="160"
    height="96"
    viewBox="0 0 160 96"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="18" y="10" width="124" height="76" rx="12" fill="#fff" />
    <path
      d="M32 72h56"
      stroke="var(--line)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="34" y="46" width="12" height="26" rx="3" fill="var(--teal-700)" />
    <rect
      x="52"
      y="30"
      width="12"
      height="42"
      rx="3"
      fill="var(--lime)"
      stroke="var(--teal-900)"
      strokeWidth="1.5"
    />
    <rect x="70" y="52" width="12" height="20" rx="3" fill="var(--teal-900)" />
    <circle
      cx="114"
      cy="46"
      r="16"
      fill="none"
      stroke="var(--lime)"
      strokeWidth="9"
    />
    <circle
      cx="114"
      cy="46"
      r="16"
      fill="none"
      stroke="var(--teal-700)"
      strokeWidth="9"
      strokeDasharray="56 100.5"
      transform="rotate(-90 114 46)"
    />
  </svg>
);

const steps = [
  {
    number: "1",
    title: "Ucapkan atau ketik",
    body: "Misalnya \u201cmakan siang 25 ribu\u201d atau \u201cgajian 5 juta\u201d. Tidak perlu format khusus.",
    art: B1,
  },
  {
    number: "2",
    title: "AI mencatat untukmu",
    body: "Nominal dan jenis transaksi terbaca otomatis, kategori ikut terisi.",
    art: B2,
  },
  {
    number: "3",
    title: "Lihat ke mana uangmu pergi",
    body: "Riwayat, total pemasukan, pengeluaran, dan sisa saldo ada di satu dashboard.",
    art: B3,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bridge pad on-dark" id="cara-kerja">
      <div className="wrap">
        <div className="intro">
          <div className="eyebrow lime">Kenalan dengan Uang Pintar AI</div>
          <h2 className="title">Catat keuangan sesimpel ngobrol.</h2>
          <p>
            Ucapkan atau ketik transaksimu dengan bahasa sehari-hari. AI yang
            mengurus sisanya, dari mencatat sampai merekap.
          </p>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <div className="step card reveal" key={step.number}>
              <div className="art">{step.art}</div>
              <div className="num">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
        <div className="center" style={{ marginTop: "40px" }}>
          <Link className="btn lime" href="/login">
            Coba Gratis Sekarang
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
