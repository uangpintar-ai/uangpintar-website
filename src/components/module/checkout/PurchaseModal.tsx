"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toastError } from "@/lib/toast";
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
  const [invoice, setInvoice] = useState<{ link: string } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setInvoice(null);
      setConfirmClose(false);
      setLoading(false);
      setError("");
      form.reset();
    }
  }, [open]);

  const submitData = form.handleSubmit((values) => {
    setData(values);
    setError("");
    setStep(2);
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

      setInvoice({ link: payload.link });
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

  return (
    <>
      <Dialog
        open={open && !invoice}
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
                      className="h-11 w-full rounded-xl bg-dl-primary text-base font-semibold text-white hover:bg-dl-primary/90"
                    >
                      Lanjut ke Ringkasan
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

      <Dialog
        open={Boolean(invoice)}
        onOpenChange={(next) => {
          if (!next) setConfirmClose(true);
        }}
      >
        {invoice && (
          <DialogContent
            showCloseButton={false}
            className="h-[85vh] w-fit max-w-[calc(100vw-2rem)] gap-0 overflow-hidden border-0 bg-white p-0"
          >
            <DialogTitle className="sr-only">Pembayaran Mayar</DialogTitle>
            <DialogDescription className="sr-only">
              Halaman pembayaran Mayar
            </DialogDescription>
            <iframe
              src={invoice.link}
              title="Pembayaran Mayar"
              allow="payment"
              className="h-full w-[420px] max-w-full border-0"
            />
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran belum selesai. Kalau ditutup, kamu harus memulai
              checkout lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={onClose}
              className="bg-dl-error text-white hover:bg-dl-error/90"
            >
              Tutup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PurchaseModal;
