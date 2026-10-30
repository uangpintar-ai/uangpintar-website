"use client";

import { UangPintarLogoNoBg } from "@/lib/images";
import Image from "next/image";

type Props = {
  children: React.ReactNode;
  hideAside?: boolean;
};

const AuthUserLayout = ({ children, hideAside = false }: Props) => {
  return (
    <div className="relative flex h-dvh w-screen overflow-hidden bg-dl-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dl-gradient-2/10 via-transparent to-dl-gradient-4/25" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-dl-gradient-2/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-80 rounded-full bg-dl-gradient-4/20 blur-3xl" />

      <main className="relative z-10 flex w-full flex-col items-center overflow-y-auto px-4 py-10 sm:px-6 lg:flex-1 lg:py-12">
        <div className="my-auto w-full max-w-md lg:max-w-lg">{children}</div>
      </main>

      {!hideAside && (
        <aside className="relative hidden h-full flex-1 overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-8">
          <div className="relative aspect-square w-[55%] drop-shadow-2xl">
            <Image
              src={UangPintarLogoNoBg}
              alt="Uang Pintar"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">Uang Pintar AI</p>
            <p className="mt-2 text-base font-medium text-white/70">
              Catat Penjualanmu Dibantu AI
            </p>
          </div>
        </aside>
      )}
    </div>
  );
};

export default AuthUserLayout;
