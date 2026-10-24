"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { toastError } from "@/lib/toast";
import type { PlanId } from "@/const/payment";

type Props = {
  planId: PlanId;
  planName: string;
  period: string;
  amount: number;
  name: string;
  email: string;
  customer?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  embedded?: boolean;
  onUnauthorized?: () => void;
};

const CheckoutForm = ({
  planId,
  planName,
  period,
  amount,
  name,
  email,
  customer,
  embedded = false,
  onUnauthorized,
}: Props) => {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!/^\+?[0-9\s-]{10,18}$/.test(mobile.trim())) {
      setError("Masukkan nomor WhatsApp yang valid.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/mayar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          mobile,
          ...(customer
            ? {
                email: customer.email,
                first_name: customer.firstName,
                last_name: customer.lastName,
              }
            : {}),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        link?: string;
        message?: string;
      } | null;

      if (response.status === 401) {
        if (onUnauthorized) {
          setLoading(false);
          onUnauthorized();
          return;
        }
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message ?? "Gagal membuat pembayaran.");
      }

      if (!data?.link?.startsWith("https://")) {
        throw new Error("Link pembayaran tidak valid.");
      }

      window.location.href = data.link;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Gagal membuat pembayaran. Coba lagi.";
      setError(message);
      toastError("Gagal", message);
      setLoading(false);
    }
  };

  const content = (
    <>
      {!embedded && (
        <>
          <p className="text-sm font-semibold uppercase tracking-wider text-dl-primary">
            Uang Pintar AI
          </p>
          <h1 className="mt-2 text-2xl font-bold text-dl-foreground">
            Selesaikan pembayaran
          </h1>
        </>
      )}

      <div className={`rounded-2xl bg-dl-cream p-4${embedded ? "" : " mt-6"}`}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-bold text-dl-foreground">{planName}</p>
            <p className="text-sm text-dl-muted">{period}</p>
          </div>
          <p className="text-xl font-extrabold text-dl-foreground">
            {formatCurrency(amount)}
          </p>
        </div>
        <div className="mt-4 border-t border-dl-border pt-3 text-sm text-dl-muted">
          <p>{name}</p>
          <p>{email}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="mobile"
            className="mb-2 block text-sm font-semibold text-dl-foreground"
          >
            Nomor WhatsApp
          </label>
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value);
              setError("");
            }}
            className="h-12 bg-white"
            required
          />
          <p className="mt-1 text-xs text-dl-muted">
            Dipakai untuk mengirim bukti dan pengingat pembayaran.
          </p>
        </div>

        {error && <p className="text-sm font-medium text-dl-error">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-dl-primary text-base font-semibold text-white hover:bg-dl-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Menyiapkan pembayaran...
            </>
          ) : (
            "Lanjut ke Pembayaran"
          )}
        </Button>
      </form>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-dl-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-dl-primary" />
        Pembayaran diproses aman oleh Mayar. Paket aktif otomatis setelah
        pembayaran berhasil.
      </p>
    </>
  );

  if (embedded) return <div>{content}</div>;

  return (
    <div className="w-full max-w-md">
      <Link
        href="/#paket"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-dl-muted transition-colors hover:text-dl-primary"
      >
        <ArrowLeft className="size-4" />
        Kembali ke paket
      </Link>

      <div className="rounded-3xl border border-dl-border bg-white p-6 shadow-xl shadow-dl-foreground/5 sm:p-8">
        {content}
      </div>
    </div>
  );
};

export default CheckoutForm;
