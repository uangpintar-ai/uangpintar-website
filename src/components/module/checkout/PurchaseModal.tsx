"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaymentDialog from "@/components/module/checkout/PaymentDialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import { checkoutLeadSchema } from "@/schema/payment-schema";
import { PLANS, type PlanId } from "@/const/payment";

const purchaseSchema = checkoutLeadSchema.extend({
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,18}$/, "Masukkan nomor WhatsApp yang valid"),
});

type PurchaseSchema = z.infer<typeof purchaseSchema>;

type Props = {
  planId: PlanId | null;
  onClose: () => void;
};

const PurchaseModal = ({ planId, onClose }: Props) => {
  const open = planId !== null;
  const plan = planId ? PLANS[planId] : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<PurchaseSchema | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState("");

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
    if (!open) {
      setStep(1);
      setData(null);
      setLink(null);
      setLoading(false);
      setCheckingEmail(false);
      setError("");
      form.reset();
    }
  }, [open]);

  const submitData = form.handleSubmit(async (values) => {
    setError("");
    setCheckingEmail(true);

    try {
      const response = await fetch("/api/checkout/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const payload = (await response.json().catch(() => null)) as {
        emailValid?: boolean;
        registered?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? "Gagal memeriksa email.");
      }

      if (!payload.emailValid || payload.registered) {
        form.setError("email", {
          message: payload.message ?? "Email tidak dapat digunakan.",
        });
        return;
      }

      setData(values);
      setStep(2);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Gagal memeriksa email.";
      setError(message);
      toastError("Gagal", message);
    } finally {
      setCheckingEmail(false);
    }
  });

  const checkout = async () => {
    if (!plan || !data) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mayar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          mobile: data.mobile,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        link?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal membuat pembayaran.");
      }

      if (!payload?.link?.startsWith("https://")) {
        throw new Error("Link pembayaran tidak valid.");
      }

      setLink(payload.link);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Gagal membuat pembayaran. Coba lagi.";
      setError(message);
      toastError("Gagal", message);
    } finally {
      setLoading(false);
    }
  };

  const skipPayment = async () => {
    if (!plan || !data) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mayar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          mobile: data.mobile,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
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
      onClose();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Gagal melewati pembayaran.";
      setError(message);
      toastError("Gagal", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && !link}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        {plan && (
          <DialogContent className="max-h-[90vh] bg-white sm:max-w-md">
            <div className="flex items-center gap-3 rounded-2xl border border-dl-border/70 bg-dl-cream/40 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-xs font-bold text-white shadow-sm shadow-dl-primary/25 transition-all">
                  {step > 1 ? <Check className="size-4" /> : "1"}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    step >= 1 ? "text-dl-foreground" : "text-dl-muted",
                  )}
                >
                  Data
                </span>
              </div>

              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-dl-border/70">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary transition-all duration-500",
                    step === 2 ? "w-full" : "w-0",
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    step === 2
                      ? "bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-sm shadow-dl-primary/25"
                      : "border border-dl-border bg-white text-dl-muted",
                  )}
                >
                  2
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    step === 2 ? "text-dl-foreground" : "text-dl-muted",
                  )}
                >
                  Ringkasan
                </span>
              </div>
            </div>

            {step === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl text-dl-foreground">
                    Isi data kamu
                  </DialogTitle>
                  <DialogDescription>
                    {plan.name} &middot; {plan.period} &mdash;{" "}
                    {formatCurrency(plan.amount)}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={submitData} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@contoh.com"
                              autoComplete="email"
                              {...field}
                              onChange={(event) => {
                                field.onChange(event);
                                form.clearErrors("email");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama depan</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nama depan"
                                autoComplete="given-name"
                                {...field}
                              />
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
                            <FormLabel>Nama belakang</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nama belakang"
                                autoComplete="family-name"
                                {...field}
                              />
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
                          <FormLabel>Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="tel"
                              placeholder="08xxxxxxxxxx"
                              autoComplete="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={checkingEmail}
                      className="h-11 w-full rounded-xl bg-dl-primary text-base font-semibold text-white hover:bg-dl-primary/90"
                    >
                      {checkingEmail
                        ? "Memeriksa email..."
                        : "Lanjut ke Ringkasan"}
                    </Button>
                  </form>
                </Form>

                <p className="text-xs leading-relaxed text-dl-muted">
                  Setelah pembayaran berhasil, kami kirim link ke email ini
                  untuk mengatur kata sandi akunmu.
                </p>

                <p className="text-center text-sm text-dl-muted">
                  Sudah punya akun?{" "}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(
                      `/user/upgrade?plan=${plan.id}`,
                    )}`}
                    className="font-semibold text-dl-primary underline underline-offset-4"
                  >
                    Masuk
                  </Link>
                </p>
              </>
            ) : (
              data && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl text-dl-foreground">
                      Ringkasan pembayaran
                    </DialogTitle>
                    <DialogDescription>
                      Periksa data sebelum melanjutkan ke pembayaran.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="rounded-2xl bg-dl-cream p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <p className="font-bold text-dl-foreground">
                          {plan.name}
                        </p>
                        <p className="text-sm text-dl-muted">{plan.period}</p>
                      </div>
                      <p className="text-xl font-extrabold text-dl-foreground">
                        {formatCurrency(plan.amount)}
                      </p>
                    </div>
                    <div className="mt-4 space-y-1 border-t border-dl-border pt-3 text-sm text-dl-muted">
                      <p>
                        {data.first_name} {data.last_name}
                      </p>
                      <p>{data.email}</p>
                      <p>{data.mobile}</p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm font-medium text-dl-error">{error}</p>
                  )}

                  <Button
                    type="button"
                    onClick={() => {
                      void checkout();
                    }}
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-dl-primary text-base font-semibold text-white hover:bg-dl-primary/90"
                  >
                    {loading ? "Menyiapkan pembayaran..." : "Checkout"}
                  </Button>

                  {process.env.NODE_ENV === "development" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void skipPayment();
                      }}
                      disabled={loading}
                      className="h-10 w-full rounded-xl border-dashed border-dl-border text-dl-muted"
                    >
                      Lewati Pembayaran (Development)
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    className="text-xs font-semibold text-dl-muted underline underline-offset-4 hover:text-dl-foreground"
                  >
                    Ubah data
                  </button>
                </>
              )
            )}
          </DialogContent>
        )}
      </Dialog>

      <PaymentDialog link={link} onClose={onClose} />
    </>
  );
};

export default PurchaseModal;
