"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Copy, Loader2, Mail, Phone, UserRound } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UangPintarWhiteLogoNoBg } from "@/lib/images";
import { cn, formatCurrency } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import { checkoutLeadSchema } from "@/schema/payment-schema";
import { PLANS, type PlanId, type PlanPrices } from "@/const/payment";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_CHANNELS,
  type MayarPaymentDetail,
  type MayarPaymentMethod,
} from "@/const/mayar-payment";

const purchaseSchema = checkoutLeadSchema.extend({
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,18}$/, "Masukkan nomor WhatsApp yang valid"),
});

type PurchaseSchema = z.infer<typeof purchaseSchema>;

type PaymentState = {
  detail: MayarPaymentDetail | null;
  link: string;
  method: MayarPaymentMethod;
  planId: PlanId;
};

const plans = Object.values(PLANS);

const planBilling: Record<PlanId, string> = {
  pemula_monthly: "per bulan",
  pemula_yearly: "per tahun",
  jago_lifetime: "sekali bayar",
};

type Props = {
  initialPlan: PlanId;
  prices: PlanPrices;
};

const PurchaseCheckout = ({ initialPlan, prices }: Props) => {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [planId, setPlanId] = useState<PlanId>(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<MayarPaymentMethod>(
    DEFAULT_PAYMENT_METHOD,
  );
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS[planId];
  const method = PAYMENT_CHANNELS.find(
    (channel) => channel.code === paymentMethod,
  );
  const showPayment = Boolean(payment && !editing);
  const paymentPlan = payment ? PLANS[payment.planId] : plan;
  const paymentMethodLabel = payment
    ? (PAYMENT_CHANNELS.find((channel) => channel.code === payment.method)
        ?.label ?? payment.method)
    : method?.label;

  const form = useForm<PurchaseSchema>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      mobile: "",
    },
  });

  useEffect(() => {
    if (!payment || payment.detail) return;

    const configureMayar = (event: MessageEvent) => {
      const iframe = iframeRef.current;

      if (!iframe?.contentWindow || event.source !== iframe.contentWindow)
        return;
      if (
        (event.data as { type?: string } | null)?.type !==
        "mayar-iframe-react-ready"
      ) {
        return;
      }

      iframe.contentWindow.postMessage(
        {
          target: "mayar-checkout-embed",
          data: {
            layoutMode: "SIMPLE",
            hideMerchantLogo: true,
            hideProductImages: true,
            hideHeader: true,
            hideLanguage: true,
            hideDescProduct: true,
            hideBadgeSecure: true,
          },
        },
        "*",
      );
    };

    window.addEventListener("message", configureMayar);
    return () => window.removeEventListener("message", configureMayar);
  }, [payment]);

  const submitData = form.handleSubmit(async (values) => {
    setError("");
    setSubmitting(true);

    try {
      const checkResponse = await fetch("/api/checkout/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const checkPayload = (await checkResponse.json().catch(() => null)) as {
        emailValid?: boolean;
        registered?: boolean;
        message?: string;
      } | null;

      if (!checkResponse.ok || !checkPayload) {
        throw new Error(checkPayload?.message ?? "Gagal memeriksa email.");
      }

      if (!checkPayload.emailValid || checkPayload.registered) {
        form.setError("email", {
          message: checkPayload.message ?? "Email tidak dapat digunakan.",
        });
        return;
      }

      const response = await fetch("/api/mayar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          payment_method: paymentMethod,
          mobile: values.mobile,
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        link?: string;
        message?: string;
        paymentDetail?: MayarPaymentDetail | null;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal membuat pembayaran.");
      }

      if (!payload?.link?.startsWith("https://")) {
        throw new Error("Link pembayaran tidak valid.");
      }

      setCopied(false);
      setPayment({
        link: payload.link,
        detail: payload.paymentDetail ?? null,
        method: paymentMethod,
        planId: plan.id,
      });
      setEditing(false);
    } catch (caught) {
      const raw =
        caught instanceof Error
          ? caught.message
          : "Gagal membuat pembayaran. Coba lagi.";
      const message = /duplicate request|wait 1 minute/i.test(raw)
        ? "Tunggu sekitar 1 menit sebelum mengganti metode pembayaran."
        : raw;
      setError(message);
      toastError("Gagal", message);
    } finally {
      setSubmitting(false);
    }
  });

  const skipPayment = async (values: PurchaseSchema) => {
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/mayar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          mobile: values.mobile,
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          skip_payment: true,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        setupUrl?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal melewati pembayaran.");
      }

      if (payload?.setupUrl) {
        console.info("[dev] Link atur kata sandi:", payload.setupUrl);
        toastSuccess(
          "Pembayaran dilewati",
          "Membuka halaman atur kata sandi (development).",
        );
        window.location.href = payload.setupUrl;
        return;
      }

      toastSuccess(
        "Pembayaran dilewati",
        "Paket langsung aktif (mode development). Cek email untuk mengatur kata sandi jika akun baru.",
      );
      router.push("/login");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Gagal melewati pembayaran.";
      setError(message);
      toastError("Gagal", message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccountNumber = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Gagal", "Nomor virtual account tidak bisa disalin.");
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
        <h1 className="text-2xl font-bold text-white">
          {showPayment ? "Pembayaran" : "Checkout Paket"}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {showPayment
            ? "Selesaikan pembayaran sesuai metode yang kamu pilih."
            : "Pilih paket, isi data, lalu lanjutkan pembayaran."}
        </p>
      </div>

      {showPayment && payment ? (
        <>
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-dl-border px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-dl-foreground">
                  {paymentPlan.name}
                </p>
                <p className="text-xs text-dl-muted">
                  {formatCurrency(prices[payment.planId])} ·{" "}
                  {paymentMethodLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setCopied(false);
                }}
                className="shrink-0 text-xs font-semibold text-dl-primary underline underline-offset-4 transition-colors hover:text-dl-foreground"
              >
                Ubah metode / paket
              </button>
            </div>

            <div className="space-y-5 p-5">
              {payment.detail?.kind === "qris" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-2xl border border-dl-border bg-white p-3">
                    <QRCode value={payment.detail.qrString} size={180} />
                  </div>
                  <p className="text-center text-sm text-dl-muted">
                    Scan QR ini pakai aplikasi e-wallet atau m-banking yang
                    mendukung QRIS.
                  </p>
                </div>
              )}

              {payment.detail?.kind === "virtual_account" && (
                <>
                  <div className="rounded-2xl bg-dl-cream p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dl-muted">
                      {payment.detail.bank} Virtual Account
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="font-mono text-xl font-bold tracking-wider text-dl-foreground">
                        {payment.detail.accountNumber}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void copyAccountNumber(
                            payment.detail?.kind === "virtual_account"
                              ? payment.detail.accountNumber
                              : "",
                          );
                        }}
                      >
                        {copied ? <Check /> : <Copy />}
                        {copied ? "Tersalin" : "Salin"}
                      </Button>
                    </div>
                    {payment.detail.accountName && (
                      <p className="mt-2 text-sm text-dl-muted">
                        a.n. {payment.detail.accountName}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-dl-muted">
                    Transfer sesuai nominal tepat sampai batas waktu pembayaran.
                  </p>
                </>
              )}

              {payment.detail?.kind === "ewallet" && (
                <div className="flex flex-col items-center gap-4">
                  {payment.detail.qrString && (
                    <div className="rounded-2xl border border-dl-border bg-white p-3">
                      <QRCode value={payment.detail.qrString} size={180} />
                    </div>
                  )}

                  {(() => {
                    const links = payment.detail?.links ?? [];
                    const primary =
                      links.find((item) => item.kind === "deeplink") ??
                      links.find((item) => item.kind === "mobile") ??
                      links[0];

                    return primary ? (
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
                      >
                        <a
                          href={primary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Bayar Sekarang
                        </a>
                      </Button>
                    ) : null;
                  })()}

                  <p className="text-center text-sm text-dl-muted">
                    Lanjutkan pembayaran di aplikasi e-wallet kamu.
                  </p>
                </div>
              )}

              {!payment.detail && (
                <>
                  <p className="text-sm text-dl-muted">
                    Pilih metode pembayaran di halaman Mayar di bawah ini.
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-dl-border">
                    <iframe
                      ref={iframeRef}
                      src={payment.link}
                      title="Pembayaran Mayar"
                      allow="payment"
                      className="h-[70vh] min-h-[520px] w-full border-0"
                    />
                  </div>
                </>
              )}

              <p className="text-xs leading-relaxed text-dl-muted">
                Paket aktif otomatis setelah pembayaran berhasil. Kamu bisa
                mengganti metode atau paket sebelum membayar.
              </p>
            </div>
          </div>
        </>
      ) : (
        <Form {...form}>
          <form onSubmit={submitData} className="space-y-5">
            {payment && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-xs text-white/70">
                  Pembayaran sebelumnya masih tersedia.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  className="shrink-0 text-xs font-semibold text-white underline underline-offset-4"
                >
                  Lihat
                </button>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Pilih paket</p>
                <Link
                  href="/#paket"
                  className="text-xs font-medium text-white/60 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Lihat detail
                </Link>
              </div>
              <div
                role="radiogroup"
                aria-label="Pilih paket"
                className="space-y-2"
              >
                {plans.map((option) => {
                  const selected = option.id === planId;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setPlanId(option.id);
                        setError("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                        selected
                          ? "border-dl-gradient-2 bg-white/10 ring-1 ring-dl-gradient-2"
                          : "border-white/15 bg-white/5 hover:border-white/30",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          {option.name}
                        </span>
                        <span className="block text-xs text-white/60">
                          {option.period}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold text-white">
                          {formatCurrency(prices[option.id])}
                        </span>
                        <span className="block text-[11px] text-white/50">
                          {planBilling[option.id]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                      <Input
                        type="email"
                        placeholder="Masukkan email"
                        autoComplete="email"
                        className="bg-white pl-9"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          form.clearErrors("email");
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nama Depan</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                        <Input
                          placeholder="Nama depan"
                          autoComplete="given-name"
                          className="bg-white pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nama Belakang</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                        <Input
                          placeholder="Nama belakang"
                          autoComplete="family-name"
                          className="bg-white pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Nomor WhatsApp</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="08xxxxxxxxxx"
                        autoComplete="tel"
                        className="bg-white pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="mb-2 text-sm font-semibold text-white">
                Metode pembayaran
              </p>
              <div
                role="radiogroup"
                aria-label="Metode pembayaran"
                className="grid grid-cols-2 gap-2"
              >
                {PAYMENT_CHANNELS.map((channel) => {
                  const selected = channel.code === paymentMethod;

                  return (
                    <button
                      key={channel.code}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setPaymentMethod(channel.code);
                        setError("");
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left transition",
                        selected
                          ? "border-dl-gradient-2 bg-white/10 ring-1 ring-dl-gradient-2"
                          : "border-white/15 bg-white/5 hover:border-white/30",
                      )}
                    >
                      <span className="block text-sm font-semibold text-white">
                        {channel.label}
                      </span>
                      <span className="block text-[11px] text-white/55">
                        {channel.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-300">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Lanjut Pembayaran"
              )}
            </Button>

            {process.env.NODE_ENV === "development" && (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  void form.handleSubmit(skipPayment)();
                }}
                className="w-full border-dashed border-white/25 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
              >
                Lewati Pembayaran (Development)
              </Button>
            )}

            <p className="text-xs leading-relaxed text-white/60">
              Setelah pembayaran berhasil, kami kirim link ke email ini untuk
              mengatur kata sandi akunmu.
            </p>
          </form>
        </Form>
      )}

      <p className="mt-6 text-center text-sm text-white/70">
        Sudah punya akun?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(
            `/checkout?plan=${planId}`,
          )}`}
          className="font-medium text-white underline underline-offset-4 hover:text-dl-gradient-2"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
};

export default PurchaseCheckout;
