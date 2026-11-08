"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { monthKey, monthName, percentOf } from "@/lib/budget";
import { cn, formatCurrency, toWibDate } from "@/lib/utils";

const BudgetOverview = () => {
  const [year, setYear] = useState(() => toWibDate().getUTCFullYear());
  const overview = api.budget.overview.useQuery({ year });
  const yearMonths = overview.data ?? [];
  const yearPlanned = yearMonths.reduce(
    (sum, month) => sum + month.plannedAmount,
    0,
  );
  const yearActual = yearMonths.reduce(
    (sum, month) => sum + month.actualExpense,
    0,
  );
  const currentMonth = monthKey(toWibDate());

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dl-foreground">Budgeting</h1>
        <p className="text-sm text-dl-muted">
          Rencana dan pengeluaran aktual per bulan. Klik salah satu bulan untuk
          mengelola detailnya.
        </p>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-dl-border px-4 py-4 sm:px-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear((value) => value - 1)}
              aria-label="Tahun sebelumnya"
              className="border-dl-border text-dl-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-base font-bold text-dl-foreground">{year}</p>
              <p className="text-xs text-dl-muted">
                Aktual {formatCurrency(yearActual)} dari{" "}
                {formatCurrency(yearPlanned)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear((value) => value + 1)}
              aria-label="Tahun berikutnya"
              className="border-dl-border text-dl-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {overview.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
            </div>
          ) : (
            <div className="divide-y divide-dl-border">
              {yearMonths.map((summary) => {
                const percent = percentOf(
                  summary.actualExpense,
                  summary.plannedAmount,
                );
                const overBudget =
                  summary.plannedAmount > 0 &&
                  summary.actualExpense > summary.plannedAmount;
                const isCurrent = summary.month === currentMonth;

                return (
                  <Link
                    key={summary.month}
                    href={`/user/budgeting/${summary.month}`}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-dl-cream/60 sm:px-6"
                  >
                    <div className="w-24 shrink-0 sm:w-28">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            isCurrent
                              ? "text-dl-primary"
                              : "text-dl-foreground",
                          )}
                        >
                          {monthName(summary.month)}
                        </span>
                        {isCurrent && (
                          <span className="size-1.5 shrink-0 rounded-full bg-dl-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-dl-muted">
                        {summary.itemCount} rencana · {summary.transactionCount}{" "}
                        aktual
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-dl-muted">
                          {formatCurrency(summary.actualExpense)} /{" "}
                          {formatCurrency(summary.plannedAmount)}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-semibold",
                            overBudget ? "text-dl-error" : "text-dl-primary",
                          )}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-dl-border">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            overBudget
                              ? "bg-dl-error"
                              : "bg-gradient-to-r from-dl-gradient-2 to-dl-primary",
                          )}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          overBudget ? "text-dl-error" : "text-dl-muted",
                        )}
                      >
                        {summary.plannedAmount > 0
                          ? overBudget
                            ? `Lebih ${formatCurrency(
                                summary.actualExpense - summary.plannedAmount,
                              )}`
                            : `Sisa ${formatCurrency(
                                summary.plannedAmount - summary.actualExpense,
                              )}`
                          : "Belum ada rencana"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-dl-muted" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOverview;
