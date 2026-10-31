"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UangPintarWhiteLogoNoBg } from "@/lib/images";
import { formatCurrency } from "@/lib/utils";
import { toastError } from "@/lib/toast";

type Props = {
  paymentId: string;
  planName: string;
  amount: number;
  hasPassword: boolean;
};

const PaymentSuccess = ({
  paymentId,
  planName,
  amount,
  hasPassword,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const openSetup = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/checkout/setup-link?paymentId=${encodeURIComponent(paymentId)}`,
      );
      const payload = (await response.json().catch(() => null)) as {
        link?: string;
        hasPassword?: boolean;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal menyiapkan link.");
      }

      if (payload?.hasPassword) {
        window.location.href = "/login";
        return;
      }

      if (!payload?.link?.startsWith("http")) {
        throw new Error("Link atur kata sandi tidak valid.");
      }

      window.location.href = payload.link;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Gagal menyiapkan link.";
      toastError("Gagal", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="mb-3 flex items-center justify-center gap-3">
          <div className="relative h-24 aspect-[1890/832] overflow-hidden rounded-sm">
            <Image
              src={UangPintarWhiteLogoNoBg}
              alt="Uang Pintar"
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      <div className="rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="size-9" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-dl-foreground">
          Pembayaran Berhasil
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dl-muted">
          Paket kamu sudah aktif. Selesaikan pengaturan akun untuk mulai
          menggunakan Uang Pintar.
        </p>

        <div className="mt-5 rounded-2xl bg-dl-cream p-4 text-left">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-bold text-dl-foreground">{planName}</p>
            <p className="text-lg font-extrabold text-dl-foreground">
              {formatCurrency(amount)}
            </p>
          </div>
        </div>

        {hasPassword ? (
          <Button
            asChild
            className="mt-6 w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
          >
            <Link href="/login">Masuk ke Akun</Link>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              void openSetup();
            }}
            disabled={loading}
            className="mt-6 w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Menyiapkan...
              </>
            ) : (
              "Atur Kata Sandi"
            )}
          </Button>
        )}

        <p className="mt-3 text-xs leading-relaxed text-dl-muted">
          Link atur kata sandi juga dikirim ke email yang kamu gunakan saat
          checkout.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
