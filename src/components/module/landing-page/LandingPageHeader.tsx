"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  { label: "Cara kerja", href: "#cara-kerja", id: "cara-kerja" },
  { label: "Manfaat", href: "#manfaat", id: "manfaat" },
  { label: "Paket", href: "#paket", id: "paket" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

const LandingPageHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const progressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${
          max > 0 ? Math.min(1, root.scrollTop / max) : 0
        })`;
      }
      setScrolled(root.scrollTop > 8);
      ticking = false;
    };

    const onScrollFrame = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };

    window.addEventListener("scroll", onScrollFrame, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScrollFrame);
  }, []);

  useEffect(() => {
    const sections = ["cara-kerja", "manfaat", "paket", "faq"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <i ref={progressRef} />
      </div>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="nav">
          <a href="#hero" className="brand">
            <span className="mark">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--lime)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </span>
            Uang Pintar AI
          </a>
          <nav className="links" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <a
                key={link.id}
                className={`l${active === link.id ? " active" : ""}`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
            <Link className="btn primary sm" href="/login">
              Mulai Gratis
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
};

export default LandingPageHeader;
