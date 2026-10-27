"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction, TransactionDetail } from "@prisma/client";
import { Calendar } from "@/components/ui/calendar";
import { CheckboxCombobox } from "@/components/ui/checkbox-combobox";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateWithTime,
} from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  FileSpreadsheet,
  Tags,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useDebounced } from "@/lib/debounced";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PiCalculator } from "react-icons/pi";
import { TransactionCategoryIcon } from "@/const/general/transaction-category-icons";
import { toastError, toastSuccess } from "@/lib/toast";
import TransactionActions from "./TransactionActions";

const FILTER_MODES = [
  { value: "day", label: "Hari" },
  { value: "month", label: "Bulan" },
  { value: "year", label: "Tahun" },
] as const;

type FilterMode = (typeof FILTER_MODES)[number]["value"];

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = { year: CURRENT_YEAR, month: new Date().getMonth() };
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i);

const NO_CACHE = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
} as const;

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type DateFilterContentProps = {
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  monthSel: { year: number; month: number } | undefined;
  onMonthChange: (sel: { year: number; month: number }) => void;
  yearSel: number | undefined;
  onYearChange: (year: number | undefined) => void;
  onApply: () => void;
  onReset: () => void;
};

const DateFilterContent = ({
  filterMode,
  onFilterModeChange,
  range,
  onRangeChange,
  monthSel,
  onMonthChange,
  yearSel,
  onYearChange,
  onApply,
  onReset,
}: DateFilterContentProps) => {
  const [draftMode, setDraftMode] = useState(filterMode);
  const [draftRange, setDraftRange] = useState(range);
  const [draftMonth, setDraftMonth] = useState(monthSel);
  const [draftYear, setDraftYear] = useState(yearSel);

  const apply = () => {
    onFilterModeChange(draftMode);
    onRangeChange(draftRange);
    if (draftMonth) onMonthChange(draftMonth);
    onYearChange(draftYear ?? CURRENT_YEAR);
    onApply();
  };

  return (
    <div className="w-full bg-white">
      <div className="flex gap-1 rounded-lg bg-dl-background p-1">
        {FILTER_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setDraftMode(mode.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              draftMode === mode.value
                ? "bg-white text-dl-primary shadow-sm"
                : "text-dl-muted hover:text-dl-foreground",
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {draftMode === "day" && (
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={draftRange}
            onSelect={setDraftRange}
            className="bg-white"
          />
        </div>
      )}
      {draftMode === "month" && (
        <div className="space-y-2 p-3">
          <Select
            value={String(draftMonth?.month ?? 0)}
            onValueChange={(v) =>
              setDraftMonth({
                year: draftMonth?.year ?? CURRENT_YEAR,
                month: Number(v),
              })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {MONTHS.map((m, i) => (
                <SelectItem
                  key={m}
                  value={String(i)}
                  className="cursor-pointer"
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(draftMonth?.year ?? CURRENT_YEAR)}
            onValueChange={(v) =>
              setDraftMonth({
                year: Number(v),
                month: draftMonth?.month ?? 0,
              })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {YEARS.map((y) => (
                <SelectItem
                  key={y}
                  value={String(y)}
                  className="cursor-pointer"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {draftMode === "year" && (
        <div className="p-3">
          <Select
            value={String(draftYear ?? CURRENT_YEAR)}
            onValueChange={(v) => setDraftYear(Number(v))}
          >
            <SelectTrigger className="h-9 w-full cursor-pointer bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {YEARS.map((y) => (
                <SelectItem
                  key={y}
                  value={String(y)}
                  className="cursor-pointer"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="border-t border-dl-border p-3">
        <Button
          onClick={apply}
          className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
        >
          Terapkan
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="mt-2 w-full border-dl-error/40 text-dl-error hover:bg-dl-error/10 hover:text-dl-error"
        >
          <X className="h-4 w-4" />
          Reset Filter
        </Button>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [monthSel, setMonthSel] = useState(CURRENT_MONTH);
  const [yearSel, setYearSel] = useState<number | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<"transaksi" | "kategori">("transaksi");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [walletIds, setWalletIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selectedItem, setSelectedItem] = useState<
    | (Transaction & {
        details: (TransactionDetail & {
          category: { name: string; icon: string } | null;
        })[];
        wallet: { name: string } | null;
      })
    | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setexportType] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL",
  );
  const [exportDateType, setExportDateType] = useState<"trx" | "created">(
    "trx",
  );
  const [exportFrom, setExportFrom] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [exportTo, setExportTo] = useState<Date | undefined>(() => new Date());
  const [exporting, setExporting] = useState(false);
  const utils = api.useUtils();
  const search = useDebounced(searchInput);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const endDate = range?.to
    ? new Date(range.to).setHours(23, 59, 59, 999)
    : undefined;

  const now = new Date();
  const startDate =
    filterMode === "month" && monthSel
      ? new Date(monthSel.year, monthSel.month, 1)
      : filterMode === "year" && yearSel
        ? new Date(yearSel, 0, 1)
        : range?.from
          ? range.from
          : new Date(now.getFullYear(), now.getMonth(), 1);

  const effectiveEndDate =
    filterMode === "month" && monthSel
      ? new Date(monthSel.year, monthSel.month + 1, 0, 23, 59, 59, 999)
      : filterMode === "year" && yearSel
        ? new Date(yearSel, 11, 31, 23, 59, 59, 999)
        : range?.to
          ? endDate
          : range?.from
            ? new Date(range.from).setHours(23, 59, 59, 999)
            : new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
              );

  const categoryFilterKey = [
    categoryId ?? "",
    type ?? "",
    walletIds.join(","),
    startDate.getTime(),
    effectiveEndDate ? new Date(effectiveEndDate).getTime() : 0,
  ].join("|");

  useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilterKey]);

  const { data: wallets } = api.wallet.findAll.useQuery(undefined, NO_CACHE);
  const walletOptions =
    wallets?.map((wallet) => ({
      value: wallet.id,
      label: wallet.name,
    })) ?? [];

  const { data: summary, isLoading: isLoadingSummary } =
    api.transaction.summary.useQuery(
      {
        start_date: startDate,
        end_date: effectiveEndDate ? new Date(effectiveEndDate) : undefined,
        type: type ?? undefined,
        walletIds: walletIds.length ? walletIds : undefined,
      },
      NO_CACHE,
    );
  const { data: list, isLoading: isLoadingList } =
    api.transaction.findAll.useQuery(
      {
        page,
        limit,
        search,
        type: type ?? undefined,
        walletIds: walletIds.length ? walletIds : undefined,
        start_date: startDate,
        end_date: effectiveEndDate ? new Date(effectiveEndDate) : undefined,
      },
      NO_CACHE,
    );

  const { data: categories } = api.category.findAll.useQuery();
  const { data: detailList, isLoading: isLoadingDetails } =
    api.transaction.findDetails.useQuery(
      {
        page: categoryPage,
        limit,
        type: type ?? undefined,
        walletIds: walletIds.length ? walletIds : undefined,
        categoryId: categoryId ?? undefined,
        start_date: startDate,
        end_date: effectiveEndDate ? new Date(effectiveEndDate) : undefined,
      },
      NO_CACHE,
    );

  useEffect(() => {
    if (list && list.meta.total_page > 0 && page > list.meta.total_page) {
      setPage(list.meta.total_page);
    }
  }, [list, page]);

  useEffect(() => {
    if (
      detailList &&
      detailList.meta.total_page > 0 &&
      categoryPage > detailList.meta.total_page
    ) {
      setCategoryPage(detailList.meta.total_page);
    }
  }, [detailList, categoryPage]);

  const rangeLabel =
    range?.from && range?.to
      ? `${formatDate(range.from.toISOString())} - ${formatDate(
          range.to.toISOString(),
        )}`
      : range?.from
        ? `Dari ${formatDate(range.from.toISOString())}`
        : "Pilih rentang tanggal";

  const filterLabel =
    filterMode === "month"
      ? monthSel
        ? `${MONTHS[monthSel.month]} ${monthSel.year}`
        : "Pilih bulan"
      : filterMode === "year"
        ? yearSel
          ? String(yearSel)
          : "Pilih tahun"
        : rangeLabel;

  const resetFilter = () => {
    setRange(undefined);
    setMonthSel(CURRENT_MONTH);
    setYearSel(undefined);
    setWalletIds([]);
    setCalendarOpen(false);
    setSheetOpen(false);
    setFilterMode("month");
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const start = exportFrom ? new Date(exportFrom) : undefined;
      start?.setHours(0, 0, 0, 0);
      const end = exportTo ? new Date(exportTo) : undefined;
      end?.setHours(23, 59, 59, 999);

      const result = await utils.transaction.findAll.fetch({
        page: 1,
        limit: 100000,
        type: exportType === "ALL" ? undefined : exportType,
        start_date: start,
        end_date: end,
        date_type: exportDateType,
      });

      if (result.items.length === 0) {
        toastError(
          "Tidak ada data",
          "Tidak ada transaksi pada filter tersebut",
        );
        return;
      }

      const rows: Record<string, string | number>[] = [];
      const merges: {
        s: { r: number; c: number };
        e: { r: number; c: number };
      }[] = [];
      let rowIndex = 1;
      for (const trx of result.items) {
        const details = trx.details.length > 0 ? trx.details : [null];
        const startRow = rowIndex;
        for (const detail of details) {
          rows.push({
            "ID Transaksi": trx.trxId,
            Keterangan: trx.purpose,
            "Tipe Transaksi":
              trx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
            Rincian: detail ? detail.name : "-",
            Nominal: detail ? detail.amount : trx.totalAmount,
            "Tanggal Transaksi": formatDateWithTime(trx.trxDate.toISOString()),
            "Tanggal Pencatatan": formatDateWithTime(
              trx.createdAt.toISOString(),
            ),
          });
          rowIndex++;
        }
        if (details.length > 1) {
          const endRow = rowIndex - 1;
          for (const c of [0, 1, 2, 5, 6]) {
            merges.push({ s: { r: startRow, c }, e: { r: endRow, c } });
          }
        }
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!merges"] = merges;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
      XLSX.writeFile(
        workbook,
        `transaksi-${exportFrom ? toDateInput(exportFrom) : "awal"}-${
          exportTo ? toDateInput(exportTo) : "akhir"
        }.xlsx`,
      );

      toastSuccess("Berhasil!", "Data transaksi berhasil diexport");
      setExportOpen(false);
    } catch (error) {
      toastError(
        "Gagal!",
        error instanceof Error ? error.message : "Gagal export data",
      );
    } finally {
      setExporting(false);
    }
  };

  const summaryCards = (
    <Card>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-dl-muted">
            <Wallet className="h-3.5 w-3.5 text-dl-primary" />
            Saldo
          </p>
          {isLoadingSummary ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-dl-muted" />
          ) : (
            <p className="text-2xl font-bold text-dl-foreground">
              {formatCurrency(summary?.balance ?? 0)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-dl-border pt-4 sm:flex-row sm:items-center sm:gap-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
          {isLoadingSummary ? (
            <Loader2 className="h-5 w-5 animate-spin text-dl-muted" />
          ) : (
            <>
              {type !== "EXPENSE" && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-dl-muted">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Pemasukan
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-emerald-700">
                    {formatCurrency(summary?.income.nominal ?? 0)}
                  </p>
                  <p className="text-xs text-dl-muted">
                    {summary?.income.quantity ?? 0} transaksi
                  </p>
                </div>
              )}
              {type !== "INCOME" && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-dl-muted">
                    <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                    Pengeluaran
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-rose-700">
                    {formatCurrency(summary?.expense.nominal ?? 0)}
                  </p>
                  <p className="text-xs text-dl-muted">
                    {summary?.expense.quantity ?? 0} transaksi
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dl-foreground">
            Halo, {session?.user?.firstName ?? ""}
          </h1>
          <p className="text-sm text-dl-muted">Selamat datang kembali!</p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="hidden items-center gap-2 md:flex">
            {mounted && (
              <>
                <CheckboxCombobox
                  options={walletOptions}
                  values={walletIds}
                  onChange={(values) => {
                    setWalletIds(values);
                    setPage(1);
                  }}
                  placeholder="Semua Dompet"
                  searchPlaceholder="Cari dompet..."
                  emptyText="Dompet tidak ditemukan"
                  className="h-8 w-[150px] border-dl-border bg-white text-xs font-medium text-dl-foreground"
                />
                <Select
                  value={type ?? "ALL"}
                  onValueChange={(v) => {
                    setType(v === "ALL" ? null : (v as "INCOME" | "EXPENSE"));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[150px] cursor-pointer border-dl-border bg-white text-xs font-medium text-dl-foreground">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="ALL" className="cursor-pointer">
                      Semua Tipe
                    </SelectItem>
                    <SelectItem value="INCOME" className="cursor-pointer">
                      Pemasukan
                    </SelectItem>
                    <SelectItem value="EXPENSE" className="cursor-pointer">
                      Pengeluaran
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-dl-border text-xs font-medium text-dl-foreground"
                    >
                      <CalendarDays className="h-4 w-4 text-dl-primary" />
                      {filterLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[350px] bg-white p-2"
                  >
                    <DateFilterContent
                      filterMode={filterMode}
                      onFilterModeChange={(mode) => {
                        setFilterMode(mode);
                        setPage(1);
                      }}
                      range={range}
                      onRangeChange={(selected) => {
                        setRange(selected);
                        setPage(1);
                      }}
                      monthSel={monthSel}
                      onMonthChange={(sel) => {
                        setMonthSel(sel);
                        setPage(1);
                      }}
                      yearSel={yearSel}
                      onYearChange={(year) => {
                        setYearSel(year);
                        setPage(1);
                      }}
                      onApply={() => setCalendarOpen(false)}
                      onReset={resetFilter}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>

          <div className="w-full space-y-2 md:hidden">
            {mounted ? (
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dl-border text-xs font-medium text-dl-foreground"
                  >
                    <CalendarDays className="h-4 w-4 text-dl-primary" />
                    {filterLabel}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-white px-4 pb-6 pt-4">
                  <SheetTitle className="sr-only">
                    Filter rentang tanggal
                  </SheetTitle>
                  <DateFilterContent
                    filterMode={filterMode}
                    onFilterModeChange={(mode) => {
                      setFilterMode(mode);
                      setPage(1);
                    }}
                    range={range}
                    onRangeChange={(selected) => {
                      setRange(selected);
                      setPage(1);
                    }}
                    monthSel={monthSel}
                    onMonthChange={(sel) => {
                      setMonthSel(sel);
                      setPage(1);
                    }}
                    yearSel={yearSel}
                    onYearChange={(year) => {
                      setYearSel(year);
                      setPage(1);
                    }}
                    onApply={() => setSheetOpen(false)}
                    onReset={resetFilter}
                  />
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-dl-border text-xs font-medium text-dl-foreground"
              >
                <CalendarDays className="h-4 w-4 text-dl-primary" />
                {filterLabel}
              </Button>
            )}
            {mounted && (
              <CheckboxCombobox
                options={walletOptions}
                values={walletIds}
                onChange={(values) => {
                  setWalletIds(values);
                  setPage(1);
                }}
                placeholder="Semua Dompet"
                searchPlaceholder="Cari dompet..."
                emptyText="Dompet tidak ditemukan"
                className="h-8 w-full border-dl-border bg-white text-xs font-medium text-dl-foreground"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 md:hidden">
          {(
            [
              { value: null, label: "Semua" },
              { value: "INCOME", label: "Pemasukan" },
              { value: "EXPENSE", label: "Pengeluaran" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setType(opt.value);
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                type === opt.value
                  ? opt.value === "INCOME"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : opt.value === "EXPENSE"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-dl-primary bg-dl-primary/10 text-dl-primary"
                  : "border-dl-border bg-white text-dl-muted hover:text-dl-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-dl-border bg-white p-1 sm:w-auto">
          <TabsTrigger
            value="transaksi"
            className="flex-1 gap-2 border-0 px-4 py-2 text-xs font-semibold text-dl-muted data-[state=active]:bg-gradient-to-r data-[state=active]:from-dl-gradient-2 data-[state=active]:to-dl-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dl-primary/20 sm:flex-none"
          >
            <History className="h-4 w-4" />
            Transaksi
          </TabsTrigger>
          <TabsTrigger
            value="kategori"
            className="flex-1 gap-2 border-0 px-4 py-2 text-xs font-semibold text-dl-muted data-[state=active]:bg-gradient-to-r data-[state=active]:from-dl-gradient-2 data-[state=active]:to-dl-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dl-primary/20 sm:flex-none"
          >
            <Tags className="h-4 w-4" />
            Kategori
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaksi" className="mt-4 space-y-4 sm:space-y-6">
          <div className="hidden space-y-4 md:block sm:space-y-6">
            {summaryCards}
          </div>

          <div className="space-y-4 md:hidden">{summaryCards}</div>

          <Card className="gap-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-dl-foreground">
                  <History className="h-4 w-4 text-dl-primary" />
                  Riwayat Transaksi
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportOpen(true)}
                  className="gap-2 border-dl-border text-xs font-medium text-dl-foreground"
                >
                  <FileSpreadsheet className="h-4 w-4 text-dl-primary" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 md:p-0">
              <div className="border-b border-dl-border px-4 pt-2 pb-4 sm:px-6">
                <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dl-muted" />
                  <Input
                    placeholder="Cari Transaksi"
                    className="h-9 w-full bg-white pl-9"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              {isLoadingList ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-dl-background">
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            ID Transaksi
                          </TableHead>
                          <TableHead className="min-w-[300px] max-w-[300px] px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Keterangan
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Rincian
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Tipe Transaksi
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Dompet
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Nominal
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Tanggal Transaksi
                          </TableHead>
                          <TableHead className="px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Dibuat
                          </TableHead>
                          <TableHead className="sticky right-0 bg-dl-background px-4 text-xs font-semibold tracking-wide text-dl-muted uppercase">
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list?.items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="py-10 text-center text-sm text-dl-muted"
                            >
                              Belum ada transaksi
                            </TableCell>
                          </TableRow>
                        ) : (
                          list?.items.map((item) => (
                            <TableRow key={item.id} className="group">
                              <TableCell className="px-4 py-3 font-medium text-dl-foreground">
                                {item.trxId}
                              </TableCell>
                              <TableCell className="min-w-[300px] max-w-[300px] px-4 py-3 font-medium break-words whitespace-normal text-dl-foreground">
                                {item.purpose}
                              </TableCell>
                              <TableCell className="px-4 py-3 align-top">
                                {item.details.length > 0 ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-dl-foreground"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setDetailOpen(true);
                                    }}
                                  >
                                    Lihat Rincian
                                  </Button>
                                ) : (
                                  <span className="text-xs text-dl-muted">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                    item.type === "INCOME"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-rose-200 bg-rose-50 text-rose-700",
                                  )}
                                >
                                  {item.type === "INCOME"
                                    ? "Pemasukan"
                                    : "Pengeluaran"}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-dl-foreground">
                                {item.wallet?.name ?? "-"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "px-4 py-3 font-semibold tabular-nums",
                                  item.type === "INCOME"
                                    ? "text-emerald-700"
                                    : "text-rose-700",
                                )}
                              >
                                {formatCurrency(item.totalAmount)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-dl-foreground">
                                {formatDateWithTime(item.trxDate.toISOString())}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-dl-foreground">
                                {formatDateWithTime(
                                  item.createdAt.toISOString(),
                                )}
                              </TableCell>
                              <TableCell className="sticky right-0 bg-white px-4 py-3">
                                <TransactionActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="divide-y divide-dl-border md:hidden">
                    {list?.items.length === 0 ? (
                      <p className="py-10 text-center text-sm text-dl-muted">
                        Belum ada transaksi
                      </p>
                    ) : (
                      list?.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setDetailOpen(true);
                          }}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-dl-foreground">
                              {item.purpose}
                            </p>
                            <p className="mt-0.5 text-[11px] text-dl-muted">
                              {item.wallet?.name ?? "-"}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-xs tabular-nums",
                                item.type === "INCOME"
                                  ? "text-emerald-700"
                                  : "text-rose-700",
                              )}
                            >
                              {formatCurrency(item.totalAmount)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-dl-muted" />
                        </button>
                      ))
                    )}
                  </div>

                  <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="bg-white">
                      {selectedItem && (
                        <>
                          <DialogHeader className="text-left">
                            <DialogTitle className="pr-6 text-base text-dl-foreground">
                              {selectedItem.purpose}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                              Detail transaksi
                            </DialogDescription>
                          </DialogHeader>
                          <dl className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-dl-muted">ID Transaksi</dt>
                              <dd className="text-dl-foreground">
                                {selectedItem.trxId}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-dl-muted">Tipe Transaksi</dt>
                              <dd
                                className={cn(
                                  "font-medium",
                                  selectedItem.type === "INCOME"
                                    ? "text-emerald-700"
                                    : "text-rose-700",
                                )}
                              >
                                {selectedItem.type === "INCOME"
                                  ? "Pemasukan"
                                  : "Pengeluaran"}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-dl-muted">Dompet</dt>
                              <dd className="text-dl-foreground">
                                {selectedItem.wallet?.name ?? "-"}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-dl-muted">
                                Tanggal Transaksi
                              </dt>
                              <dd className="text-dl-foreground">
                                {formatDateWithTime(
                                  selectedItem.trxDate.toISOString(),
                                )}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-dl-muted">Dibuat</dt>
                              <dd className="text-dl-foreground">
                                {formatDateWithTime(
                                  selectedItem.createdAt.toISOString(),
                                )}
                              </dd>
                            </div>
                          </dl>

                          <div className="space-y-1.5">
                            {selectedItem.details.length > 0 && (
                              <div className="rounded-lg bg-dl-background p-1.5">
                                <p className="mb-1 px-1.5 text-[10px] text-dl-muted">
                                  Rincian
                                </p>
                                <div className="space-y-1">
                                  {selectedItem.details.map((detail) => (
                                    <div
                                      key={detail.id}
                                      className="flex items-center gap-2 rounded-md bg-white px-2 py-1"
                                    >
                                      <div
                                        className={cn(
                                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs",
                                          selectedItem.type === "INCOME"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-rose-50 text-rose-700",
                                        )}
                                      >
                                        <TransactionCategoryIcon
                                          icon={detail.category?.icon}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold break-words text-dl-foreground">
                                          {detail.name}
                                        </p>
                                        <p className="text-[10px] text-dl-muted">
                                          {detail.category?.name}
                                        </p>
                                      </div>
                                      <p className="shrink-0 text-[11px] font-bold tabular-nums text-dl-foreground">
                                        {formatCurrency(detail.amount)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div
                              className={cn(
                                "flex items-center justify-between rounded-lg px-3 py-2",
                                selectedItem.type === "INCOME"
                                  ? "bg-emerald-50"
                                  : "bg-rose-50",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex items-center gap-1 text-xs font-bold",
                                  selectedItem.type === "INCOME"
                                    ? "text-emerald-700"
                                    : "text-rose-700",
                                )}
                              >
                                <PiCalculator className="h-3.5 w-3.5" />
                                <span>Total</span>
                              </span>
                              <span
                                className={cn(
                                  "text-sm font-extrabold",
                                  selectedItem.type === "INCOME"
                                    ? "text-emerald-700"
                                    : "text-rose-700",
                                )}
                              >
                                {formatCurrency(selectedItem.totalAmount)}
                              </span>
                            </div>
                          </div>
                          <TransactionActions
                            item={selectedItem}
                            variant="list"
                          />
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {list && list.meta.total_item > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dl-border px-4 py-3">
                  <p className="text-xs text-dl-muted">
                    Menampilkan {(list.meta.page - 1) * list.meta.limit + 1}–
                    {Math.min(
                      list.meta.page * list.meta.limit,
                      list.meta.total_item,
                    )}{" "}
                    dari {list.meta.total_item}
                  </p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(limit)}
                      onValueChange={(value) => {
                        setLimit(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[80px] cursor-pointer bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 100].map((size) => (
                          <SelectItem
                            key={size}
                            value={String(size)}
                            className="cursor-pointer data-[state=checked]:bg-slate-100 focus:bg-slate-100 focus:text-slate-900"
                          >
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium text-dl-foreground">
                      {list.meta.page} / {list.meta.total_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={page >= list.meta.total_page}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kategori" className="mt-4">
          <Card className="gap-0">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-dl-foreground">
                  <Tags className="h-4 w-4 text-dl-primary" />
                  Detail Transaksi
                </CardTitle>
                <span className="text-xs font-medium text-dl-muted">
                  Total: {formatCurrency(detailList?.totalAmount ?? 0)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 md:p-0">
              <div className="flex flex-wrap gap-2 border-b border-dl-border px-4 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    categoryId === null
                      ? "border-dl-primary bg-dl-primary/10 text-dl-primary"
                      : "border-dl-border bg-white text-dl-muted hover:text-dl-foreground",
                  )}
                >
                  Semua
                </button>
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setCategoryId((prev) =>
                        prev === category.id ? null : category.id,
                      )
                    }
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      categoryId === category.id
                        ? "border-dl-primary bg-dl-primary/10 text-dl-primary"
                        : "border-dl-border bg-white text-dl-muted hover:text-dl-foreground",
                    )}
                  >
                    <TransactionCategoryIcon
                      icon={category.icon}
                      className="h-3.5 w-3.5"
                    />
                    {category.name}
                  </button>
                ))}
              </div>

              {isLoadingDetails ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
                </div>
              ) : (
                <>
                  <div className="divide-y divide-dl-border">
                    {detailList?.items.length === 0 ? (
                      <p className="py-10 text-center text-sm text-dl-muted">
                        Belum ada rincian transaksi
                      </p>
                    ) : (
                      detailList?.items.map((detail) => (
                        <div
                          key={detail.id}
                          className="flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap sm:items-center sm:px-6"
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              detail.transaction.type === "INCOME"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700",
                            )}
                          >
                            <TransactionCategoryIcon
                              icon={detail.category?.icon}
                              className="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-dl-foreground">
                              {detail.name}
                            </p>
                            <p className="truncate text-[11px] text-dl-muted">
                              {detail.category?.name ?? "Lainnya"} ·{" "}
                              {detail.transaction.purpose}
                            </p>
                            <p className="text-[11px] text-dl-muted">
                              {formatDateWithTime(
                                detail.transaction.trxDate.toISOString(),
                              )}
                              {detail.transaction.wallet?.name
                                ? ` · ${detail.transaction.wallet.name}`
                                : ""}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "w-full shrink-0 pl-12 text-sm font-semibold tabular-nums sm:w-auto sm:pl-0",
                              detail.transaction.type === "INCOME"
                                ? "text-emerald-700"
                                : "text-rose-700",
                            )}
                          >
                            {formatCurrency(detail.amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {detailList && detailList.meta.total_item > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dl-border px-4 py-3">
                      <p className="text-xs text-dl-muted">
                        Menampilkan{" "}
                        {(detailList.meta.page - 1) * detailList.meta.limit + 1}
                        –
                        {Math.min(
                          detailList.meta.page * detailList.meta.limit,
                          detailList.meta.total_item,
                        )}{" "}
                        dari {detailList.meta.total_item}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={categoryPage <= 1}
                          onClick={() =>
                            setCategoryPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium text-dl-foreground">
                          {detailList.meta.page} / {detailList.meta.total_page}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={categoryPage >= detailList.meta.total_page}
                          onClick={() => setCategoryPage((prev) => prev + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dl-foreground">
              Export Excel
            </DialogTitle>
            <DialogDescription>
              Atur tipe transaksi dan rentang tanggal yang akan diexport
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Tipe Transaksi
              </label>
              <Select
                value={exportType}
                onValueChange={(value) =>
                  setexportType(value as "ALL" | "INCOME" | "EXPENSE")
                }
              >
                <SelectTrigger className="w-full cursor-pointer bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ALL" className="cursor-pointer">
                    Semua Tipe
                  </SelectItem>
                  <SelectItem value="INCOME" className="cursor-pointer">
                    Pemasukan
                  </SelectItem>
                  <SelectItem value="EXPENSE" className="cursor-pointer">
                    Pengeluaran
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Tipe Tanggal
              </label>
              <Select
                value={exportDateType}
                onValueChange={(value) =>
                  setExportDateType(value as "trx" | "created")
                }
              >
                <SelectTrigger className="w-full cursor-pointer bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="trx" className="cursor-pointer">
                    Tanggal Transaksi
                  </SelectItem>
                  <SelectItem value="created" className="cursor-pointer">
                    Tanggal Pencatatan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-dl-foreground">
                  Dari Tanggal
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                    >
                      <CalendarDays className="h-4 w-4 text-dl-primary" />
                      {exportFrom
                        ? formatDate(exportFrom.toISOString())
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto bg-white p-0">
                    <Calendar
                      mode="single"
                      selected={exportFrom}
                      onSelect={setExportFrom}
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-dl-foreground">
                  Sampai Tanggal
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                    >
                      <CalendarDays className="h-4 w-4 text-dl-primary" />
                      {exportTo
                        ? formatDate(exportTo.toISOString())
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto bg-white p-0">
                    <Calendar
                      mode="single"
                      selected={exportTo}
                      onSelect={setExportTo}
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
            >
              {exporting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Mengexport...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
