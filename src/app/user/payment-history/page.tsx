import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ChevronDown, Receipt } from "lucide-react";
import { authOptions } from "@/server/auth/auth-options";
import { db } from "@/server/db";
import { isPlanId, PLANS } from "@/const/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ResumePaymentButton from "@/components/module/checkout/ResumePaymentButton";
import { formatCurrency, formatDateWithTime } from "@/lib/utils";

const statuses = {
  PENDING: { label: "Menunggu Pembayaran", variant: "yellow" },
  PAID: { label: "Berhasil", variant: "green" },
  EXPIRED: { label: "Kedaluwarsa", variant: "outline" },
  FAILED: { label: "Gagal", variant: "destructive" },
} as const;

const PaymentHistoryPage = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user.userId;

  if (!userId) {
    redirect("/login?redirect=/user/payment-history");
  }

  const payments = await db.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dl-foreground">
            Riwayat Pembayaran
          </h1>
          <p className="mt-1 text-sm text-dl-muted">
            Daftar pembayaran paket yang pernah kamu buat.
          </p>
        </div>
        <Button
          asChild
          className="bg-dl-primary text-white hover:bg-dl-primary/90"
        >
          <Link href="/user/upgrade">Upgrade Paket</Link>
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-dl-border bg-white p-10 text-center">
          <Receipt className="h-8 w-8 text-dl-muted" />
          <p className="text-sm text-dl-muted">Belum ada pembayaran paket.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {payments.map((payment) => {
            const plan = isPlanId(payment.plan) ? PLANS[payment.plan] : null;
            const expired =
              payment.status === "PENDING" &&
              (!payment.expiresAt || payment.expiresAt <= new Date());
            const status = expired
              ? statuses.EXPIRED
              : statuses[payment.status];

            return (
              <details
                key={payment.id}
                className="group overflow-hidden rounded-2xl border border-dl-border bg-white"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-dl-cream/40 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="font-bold text-dl-foreground">
                      {plan ? `${plan.name} - ${plan.period}` : payment.plan}
                    </p>
                    <p className="mt-1 text-xs text-dl-muted">
                      {formatDateWithTime(payment.createdAt.toISOString())}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-extrabold text-dl-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <ChevronDown className="h-4 w-4 shrink-0 text-dl-muted transition-transform duration-200 group-open:rotate-180" />
                  </div>
                </summary>
                <div className="border-t border-dl-border p-5">
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-dl-muted">Dibuat</dt>
                      <dd className="font-medium text-dl-foreground">
                        {formatDateWithTime(payment.createdAt.toISOString())}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-dl-muted">Dibayar</dt>
                      <dd className="font-medium text-dl-foreground">
                        {payment.paidAt
                          ? formatDateWithTime(payment.paidAt.toISOString())
                          : "-"}
                      </dd>
                    </div>
                    {payment.mobile && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-dl-muted">Nomor HP</dt>
                        <dd className="font-medium text-dl-foreground">
                          {payment.mobile}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="text-dl-muted">Total</dt>
                      <dd className="font-medium text-dl-foreground">
                        {formatCurrency(payment.amount)}
                      </dd>
                    </div>
                  </dl>
                  {payment.status === "PENDING" && !expired && payment.link && (
                    <div className="mt-4">
                      <ResumePaymentButton link={payment.link} />
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
