const LandingPageFooter = () => {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="cols">
          <div className="c1">
            <b>Uang Pintar AI</b>
            <p>
              Catat keuanganmu dengan mudah, dibantu AI. Solusi praktis untuk
              mengelola keuangan pribadi.
            </p>
          </div>
          <div className="c2">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat Layanan</a>
            <a href="#">Kebijakan Refund</a>
            <span style={{ padding: "8px 0" }}>Kontak: [EMAIL / WHATSAPP]</span>
          </div>
        </div>
        <div className="copy">
          <span>
            &copy; {new Date().getFullYear()} Uang Pintar AI. Hak cipta
            dilindungi.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
