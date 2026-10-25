"use client";

import Image from "next/image";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { UangPintarLogoNoBg } from "@/lib/images";

const navLinks = [
  { label: "Cara kerja", href: "#cara-kerja", id: "cara-kerja" },
  { label: "Manfaat", href: "#manfaat", id: "manfaat" },
  { label: "Paket", href: "#paket", id: "paket" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

const LandingPageHeaderContent = () => {
  const { data: session, status } = useSession();
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
            <Image
              src={UangPintarLogoNoBg}
              alt="Uang Pintar AI"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
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
            {status === "authenticated" ? (
              <Link
                className="btn primary sm"
                href={
                  session.user.role === "ADMIN" ? "/tdibmkr" : "/user/dashboard"
                }
              >
                Dashboard
              </Link>
            ) : (
              <Link className="btn primary sm" href="/login">
                Mulai Gratis
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

const LandingPageHeader = () => (
  <SessionProvider>
    <LandingPageHeaderContent />
  </SessionProvider>
);

export default LandingPageHeader;
