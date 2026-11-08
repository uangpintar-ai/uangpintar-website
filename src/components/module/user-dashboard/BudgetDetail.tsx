"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BudgetItem } from "@prisma/client";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InputMoney from "@/components/shared/InputMoney";
import { useIsMobile } from "@/hooks/use-mobile";
import { MONTH_OPTIONS, monthLabel, percentOf, shiftMonth } from "@/lib/budget";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";

type Props = {
  month: string;
};

const BudgetDetail = ({ month }: Props) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const utils = api.useUtils();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetItem | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const [copyIds, setCopyIds] = useState<string[]>([]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(month.slice(0, 4)));

  const { data: budget, isLoading } = api.budget.findByMonth.useQuery({
    month,
  });
  const comparison = api.budget.comparison.useQuery({ month });

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setName("");
    setAmount("");
  };

  const invalidateBudget = () => {
    void utils.budget.findByMonth.invalidate({ month });
    void utils.budget.overview.invalidate();
  };

  const createItem = api.budget.createItem.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Transaksi budgeting ditambahkan");
      closeForm();
      invalidateBudget();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const updateItem = api.budget.updateItem.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Transaksi budgeting diperbarui");
      closeForm();
      invalidateBudget();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const deleteItem = api.budget.deleteItem.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Transaksi budgeting dihapus");
      setDeleteTarget(null);
      invalidateBudget();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
      setDeleteTarget(null);
    },
  });

  const copyBudget = api.budget.copyToMonth.useMutation({
    onSuccess: (result) => {
      toastSuccess("Berhasil!", `Budgeting ${monthLabel(result.month)} dibuat`);
      setCopyOpen(false);
      void utils.budget.findByMonth.invalidate();
      void utils.budget.overview.invalidate();
      router.push(`/user/budgeting/${result.month}`);
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const items = budget?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const saving = createItem.isPending || updateItem.isPending;

  const actualExpense = comparison.data?.actualExpense ?? 0;
  const actualCount = comparison.data?.transactionCount ?? 0;
  const actualTransactions = comparison.data?.transactions ?? [];
  const actualPercent = percentOf(actualExpense, total);
  const overBudget = total > 0 && actualExpense > total;

  const copyOptions = Array.from({ length: 12 }, (_, index) =>
    shiftMonth(month, index + 1),
  );

  const changeMonth = (delta: number) => {
    router.push(`/user/budgeting/${shiftMonth(month, delta)}`);
  };

  const openCreate = () => {
    setEditTarget(null);
    setName("");
    setAmount("");
    setFormOpen(true);
  };

  const openCopy = () => {
    setCopyTarget(shiftMonth(month, 1));
    setCopyIds(items.map((item) => item.id));
    setCopyOpen(true);
  };

  const saveItem = () => {
    const payload = { name: name.trim(), amount: Number(amount) };

    if (editTarget) {
      updateItem.mutate({ id: editTarget.id, ...payload });
      return;
    }

    createItem.mutate({ month, ...payload });
  };

  const handleMonthPickerOpen = (open: boolean) => {
    setMonthPickerOpen(open);
    if (open) setPickerYear(Number(month.slice(0, 4)));
  };

  const monthTrigger = (
    <button
      type="button"
      aria-label="Pilih bulan dan tahun"
      className="group flex cursor-pointer flex-col items-center rounded-lg px-3 py-1 text-center transition-colors hover:bg-dl-cream"
    >
      <span className="flex items-center gap-1.5 text-base font-bold text-dl-foreground">
        {monthLabel(month)}
        <ChevronDown className="h-3.5 w-3.5 text-dl-muted transition-transform group-data-[state=open]:rotate-180" />
      </span>
      <span className="text-xs text-dl-muted">
        {items.length} transaksi direncanakan
      </span>
    </button>
  );

  const monthPickerBody = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPickerYear((value) => value - 1)}
          aria-label="Tahun sebelumnya"
          className="h-8 w-8 text-dl-muted hover:text-dl-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-bold text-dl-foreground">{pickerYear}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPickerYear((value) => value + 1)}
          aria-label="Tahun berikutnya"
          className="h-8 w-8 text-dl-muted hover:text-dl-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTH_OPTIONS.map((label, index) => {
          const value = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
          const active = value === month;

          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                setMonthPickerOpen(false);
                router.push(`/user/budgeting/${value}`);
              }}
              className={cn(
                "cursor-pointer rounded-md px-2 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-dl-primary text-white"
                  : "text-dl-foreground hover:bg-dl-cream",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 mb-1 gap-1 text-dl-muted hover:text-dl-foreground"
          >
            <Link href="/user/budgeting">
              <ArrowLeft className="h-4 w-4" />
              Semua bulan
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-dl-foreground">Budgeting</h1>
          <p className="text-sm text-dl-muted">
            Rencanakan transaksi tiap bulan dan ceklis saat sudah dilakukan.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="border-dl-border text-dl-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {isMobile ? (
              <Dialog
                open={monthPickerOpen}
                onOpenChange={handleMonthPickerOpen}
              >
                <DialogTrigger asChild>{monthTrigger}</DialogTrigger>
                <DialogContent className="max-w-xs bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-dl-foreground">
                      Pilih Bulan
                    </DialogTitle>
                    <DialogDescription>
                      Pilih bulan dan tahun budgeting.
                    </DialogDescription>
                  </DialogHeader>
                  {monthPickerBody}
                </DialogContent>
              </Dialog>
            ) : (
              <Popover
                open={monthPickerOpen}
                onOpenChange={handleMonthPickerOpen}
              >
                <PopoverTrigger asChild>{monthTrigger}</PopoverTrigger>
                <PopoverContent align="center" className="w-64 p-3">
                  {monthPickerBody}
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeMonth(1)}
              aria-label="Bulan berikutnya"
              className="border-dl-border text-dl-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={openCopy}
            disabled={items.length === 0 || isLoading}
            className="mt-4 w-full gap-2 border-dl-border text-dl-foreground"
          >
            <Copy className="h-4 w-4" />
            Salin Budgeting
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-dl-foreground">
                Perbandingan dengan Transaksi
              </p>
              <p className="text-xs text-dl-muted">
                Rencana vs pengeluaran aktual bulan ini
              </p>
            </div>
            <p className="shrink-0 text-xs text-dl-muted">
              {actualCount} transaksi
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-dl-cream/60 px-3 py-2 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:bg-transparent sm:p-0">
              <p className="text-[11px] text-dl-muted">Rencana</p>
              <p className="text-sm font-bold text-dl-foreground">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-dl-cream/60 px-3 py-2 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:bg-transparent sm:p-0">
              <p className="text-[11px] text-dl-muted">Aktual</p>
              <p
                className={cn(
                  "text-sm font-bold",
                  overBudget ? "text-dl-error" : "text-dl-foreground",
                )}
              >
                {comparison.isLoading ? "..." : formatCurrency(actualExpense)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-dl-cream/60 px-3 py-2 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:bg-transparent sm:p-0">
              <p className="text-[11px] text-dl-muted">
                {overBudget ? "Lebih" : "Sisa"}
              </p>
              <p
                className={cn(
                  "text-sm font-bold",
                  overBudget ? "text-dl-error" : "text-dl-primary",
                )}
              >
                {total > 0
                  ? formatCurrency(Math.abs(total - actualExpense))
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-dl-border">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                overBudget
                  ? "bg-dl-error"
                  : "bg-gradient-to-r from-dl-gradient-2 to-dl-primary",
              )}
              style={{ width: `${Math.min(actualPercent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-dl-muted">
            {total > 0
              ? `${actualPercent}% dari rencana bulan ini`
              : "Belum ada rencana budgeting untuk dibandingkan."}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1">
          <TabsTrigger value="planning" className="w-full">
            Perencanaan
          </TabsTrigger>
          <TabsTrigger value="actual" className="w-full">
            Aktual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-dl-foreground">
                    Rencana Transaksi
                  </p>
                  <p className="text-xs text-dl-muted">
                    {isLoading
                      ? "..."
                      : `${items.length} transaksi direncanakan`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-dl-foreground">
                  {isLoading ? "..." : formatCurrency(total)}
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
                </div>
              ) : items.length > 0 ? (
                <div className="mt-3 divide-y divide-dl-border">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <p className="min-w-0 truncate text-sm font-medium text-dl-foreground">
                        {item.name}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <p className="text-sm font-semibold text-dl-foreground">
                          {formatCurrency(item.amount)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditTarget(item);
                              setName(item.name);
                              setAmount(String(Math.round(item.amount)));
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${item.name}`}
                            title="Edit transaksi"
                            className="h-7 w-7 text-dl-muted hover:bg-dl-primary/10 hover:text-dl-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Hapus ${item.name}`}
                            title="Hapus transaksi"
                            className="h-7 w-7 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-dashed border-dl-border py-10 text-center">
                  <PiggyBank className="h-8 w-8 text-dl-muted" />
                  <p className="text-sm text-dl-muted">
                    Belum ada rencana transaksi untuk bulan ini.
                  </p>
                  <Button
                    onClick={openCreate}
                    className="gap-2 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Transaksi
                  </Button>
                </div>
              )}
              {!isLoading && items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={openCreate}
                  className="mt-4 w-full gap-2 border-dashed border-dl-border text-dl-foreground hover:border-dl-primary/40 hover:bg-dl-cream/50 hover:text-dl-primary"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Transaksi
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actual" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-dl-foreground">
                    Transaksi Aktual
                  </p>
                  <p className="text-xs text-dl-muted">
                    Pengeluaran yang sudah tercatat
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-dl-foreground">
                  {comparison.isLoading ? "..." : formatCurrency(actualExpense)}
                </p>
              </div>

              {comparison.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
                </div>
              ) : actualTransactions.length > 0 ? (
                <>
                  <div className="mt-3 divide-y divide-dl-border">
                    {actualTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-start justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dl-foreground">
                            {transaction.purpose}
                          </p>
                          <p className="text-xs text-dl-muted">
                            {formatDate(transaction.trxDate.toISOString())}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-dl-foreground">
                          {formatCurrency(transaction.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {actualCount > actualTransactions.length && (
                    <p className="mt-2 text-xs text-dl-muted">
                      Menampilkan {actualTransactions.length} transaksi terbaru
                      dari {actualCount}.
                    </p>
                  )}
                </>
              ) : (
                <p className="py-6 text-center text-sm text-dl-muted">
                  Belum ada transaksi pengeluaran bulan ini.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dl-foreground">
              {editTarget ? "Edit Transaksi" : "Tambah Transaksi"}
            </DialogTitle>
            <DialogDescription>
              Isi rencana transaksi untuk {monthLabel(month)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Nama Transaksi
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Belanja bulanan"
                maxLength={100}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Nominal
              </label>
              <InputMoney
                value={amount}
                onChange={(value: string) => setAmount(value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              disabled={!name.trim() || Number(amount) <= 0 || saving}
              onClick={saveItem}
              className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dl-foreground">
              Salin Budgeting
            </DialogTitle>
            <DialogDescription>
              Pilih bulan tujuan dan transaksi yang ingin disalin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Bulan Tujuan
              </label>
              <Select value={copyTarget} onValueChange={setCopyTarget}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {copyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {monthLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Transaksi yang Disalin
              </label>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-dl-border p-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-dl-cream/60"
                  >
                    <Checkbox
                      checked={copyIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        setCopyIds((current) =>
                          checked === true
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-dl-foreground">
                        {item.name}
                      </span>
                      <span className="block text-xs text-dl-muted">
                        {formatCurrency(item.amount)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-dl-muted">
                {copyIds.length} dari {items.length} transaksi dipilih
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={
                copyIds.length === 0 || !copyTarget || copyBudget.isPending
              }
              onClick={() =>
                copyBudget.mutate({
                  sourceMonth: month,
                  targetMonth: copyTarget,
                  itemIds: copyIds,
                })
              }
              className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
            >
              {copyBudget.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Menyalin...
                </>
              ) : (
                "Salin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dl-foreground">
              Hapus transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi {deleteTarget?.name} akan dihapus dari budgeting bulan
              ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteItem.mutate({ id: deleteTarget.id })
              }
              className="bg-dl-error text-white hover:bg-dl-error/90"
            >
              {deleteItem.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetDetail;
