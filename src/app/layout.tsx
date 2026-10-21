import "@/styles/globals.css";

import { type Metadata } from "next";
import Script from "next/script";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ReactQueryDevtoolsDev from "@/components/devtools/ReactQueryDevtoolsDev";

export const metadata: Metadata = {
  title: "Uang Pintar AI: Catat Keuanganmu Dibantu AI",
  description: "Catat Keuanganmu Dibantu AI Cuma 10 Ribu / Bulan",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icons/uang-pintar.png" },
  ],
  manifest: "/manifest.json",
  applicationName: "Uang Pintar AI",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="font-sans">
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1729249711512718');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1729249711512718&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <TRPCReactProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-center" richColors />
          <ReactQueryDevtoolsDev />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
