"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Calculator,
  Save,
} from "lucide-react";
import type { Transaction, TransactionDetail } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  transactionUpdateSchema,
  type TransactionUpdateSchema,
} from "@/schema/transaction-schema";
import { api } from "@/trpc/react";
import InputMoney from "@/components/shared/InputMoney";
import { TransactionCategoryIcon } from "@/const/general/transaction-category-icons";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

type Props = {
  item: Transaction & { details: TransactionDetail[] };
  variant?: "icon" | "list";
};

const TransactionActions = ({ item, variant = "icon" }: Props) => {
  const utils = api.useUtils();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [trxTime, setTrxTime] = useState(
    () =>
      `${String(item.trxDate.getHours()).padStart(2, "0")}:${String(
        item.trxDate.getMinutes(),
      ).padStart(2, "0")}`,
  );

  const invalidate = () => {
    utils.transaction.findAll.invalidate();
    utils.transaction.summary.invalidate();
    utils.wallet.findAll.invalidate();
  };

  const editTransaction = api.transaction.update.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Transaksi berhasil diperbarui");
      setEditOpen(false);
      invalidate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const deleteTransaction = api.transaction.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Transaksi berhasil dihapus");
      setDeleteOpen(false);
      invalidate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const form = useForm<TransactionUpdateSchema>({
    resolver: zodResolver(transactionUpdateSchema),
    defaultValues: {
      id: item.id,
      purpose: item.purpose,
      type: item.type,
      details: item.details.length
        ? item.details.map((d) => ({
            name: d.name,
            amount: String(d.amount),
            categoryId: d.categoryId,
          }))
        : [{ name: "", amount: "", categoryId: "" }],
      trx_date: item.trxDate,
      walletId: item.walletId,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  const { data: wallets } = api.wallet.findAll.useQuery();
  const { data: categories } = api.category.findAll.useQuery();

  useEffect(() => {
    if (wallets?.length && !form.getValues("walletId")) {
      form.setValue("walletId", wallets[0]!.id);
    }
  }, [wallets, form]);

  useEffect(() => {
    if (!categories?.length) return;
    const fallback = categories[0]!.id;
    const current = form.getValues("details");
    if (current.some((detail) => !detail.categoryId)) {
      form.setValue(
        "details",
        current.map((detail) => ({
          ...detail,
          categoryId: detail.categoryId || fallback,
        })),
      );
    }
  }, [categories, form]);

  const type = form.watch("type");
  const details = form.watch("details");
  const total = details.reduce(
    (sum, d) => sum + (Number(String(d.amount).replace(/\D/g, "")) || 0),
    0,
  );

  return (
    <>
      {variant === "icon" ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-dl-muted hover:bg-dl-primary/10 hover:text-dl-primary"
            onClick={() => setEditOpen(true)}
            aria-label="Edit transaksi"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error"
            onClick={() => setDeleteOpen(true)}
            aria-label="Hapus transaksi"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 border-t border-dl-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-dl-foreground"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-dl-error/40 text-dl-error hover:bg-dl-error/10 hover:text-dl-error"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white sm:max-w-2xl !p-0 overflow-hidden flex flex-col justify-between">
          <DialogHeader className="z-10 border-b border-dl-border bg-white p-4 text-left">
            <DialogTitle className="text-dl-foreground">
              Edit Transaksi
            </DialogTitle>
            <DialogDescription>Perbarui informasi transaksi</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              id="edit-transaction-form"
              onSubmit={form.handleSubmit((values) => {
                const [h, m] = trxTime.split(":").map(Number);
                const trxDate = new Date(values.trx_date ?? item.trxDate);
                trxDate.setHours(h ?? 0, m ?? 0, 0, 0);
                editTransaction.mutate({ ...values, trx_date: trxDate });
              })}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="space-y-4 flex-1 overflow-auto px-4">
                <FormField
                  control={form.control}
                  name="walletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dompet</FormLabel>
                      <FormControl>
                        <Combobox
                          options={
                            wallets?.map((wallet) => ({
                              value: wallet.id,
                              label: `${wallet.name} - ${formatCurrency(wallet.balance)}`,
                            })) ?? []
                          }
                          value={field.value ?? ""}
                          onChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                          placeholder="Pilih dompet"
                          searchPlaceholder="Cari dompet..."
                          emptyText="Dompet tidak ditemukan"
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange("INCOME")}
                            className={cn(
                              "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              field.value === "INCOME"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-dl-border bg-white text-dl-muted hover:border-dl-border/60",
                            )}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Pemasukan
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("EXPENSE")}
                            className={cn(
                              "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              field.value === "EXPENSE"
                                ? "border-rose-500 bg-rose-50 text-rose-700"
                                : "border-dl-border bg-white text-dl-muted hover:border-dl-border/60",
                            )}
                          >
                            <TrendingDown className="h-4 w-4" />
                            Pengeluaran
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keterangan</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Keterangan transaksi"
                          className="resize-none bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Rincian</FormLabel>
                  <div className="space-y-2">
                    {fields.map((detail, index) => (
                      <div
                        key={detail.id}
                        className="flex flex-col gap-3 rounded-xl border border-dl-border bg-dl-background/60 p-3 sm:flex-row sm:items-start sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                      >
                        <div className="flex items-center justify-between sm:hidden">
                          <span className="text-xs font-semibold text-dl-muted">
                            Rincian {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                            aria-label="Hapus rincian"
                            className="h-8 w-8 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name={`details.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="w-full sm:flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Nama rincian"
                                  className="bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex flex-col gap-2 sm:contents">
                          <FormField
                            control={form.control}
                            name={`details.${index}.categoryId`}
                            render={({ field }) => (
                              <FormItem className="w-full sm:w-44 sm:flex-none">
                                <FormControl>
                                  <Combobox
                                    options={
                                      categories?.map((category) => ({
                                        value: category.id,
                                        label: category.name,
                                        icon: (
                                          <TransactionCategoryIcon
                                            icon={category.icon}
                                            className="h-4 w-4 shrink-0"
                                          />
                                        ),
                                      })) ?? []
                                    }
                                    value={field.value ?? ""}
                                    onChange={(value) =>
                                      value && field.onChange(value)
                                    }
                                    placeholder="Pilih kategori"
                                    searchPlaceholder="Cari kategori..."
                                    emptyText="Kategori tidak ditemukan"
                                    className="bg-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`details.${index}.amount`}
                            render={({ field }) => (
                              <FormItem className="w-full sm:w-40 sm:flex-none">
                                <FormControl>
                                  <InputMoney
                                    placeholder="50.000"
                                    value={field.value}
                                    onChange={(e: any) => field.onChange(e)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                            aria-label="Hapus rincian"
                            className="mt-0.5 hidden shrink-0 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error sm:inline-flex"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          name: "",
                          amount: "",
                          categoryId: categories?.[0]?.id ?? "",
                        })
                      }
                      className="h-10 w-full gap-2 border-dashed border-dl-border text-dl-muted sm:h-8 sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Rincian
                    </Button>
                    <div className="flex items-center justify-between rounded-xl border border-dl-border bg-white px-3 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-dl-muted">
                        <Calculator className="h-4 w-4 text-dl-primary" />
                        Total
                      </span>
                      <span className="text-base font-bold text-dl-foreground">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </FormItem>
                <FormField
                  control={form.control}
                  name="trx_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Tanggal{" "}
                        {type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                            >
                              <CalendarDays className="h-4 w-4 text-dl-primary" />
                              {field.value
                                ? formatDate(field.value.toISOString())
                                : "Pilih tanggal"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto bg-white p-0"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Jam {type === "INCOME" ? "Pemasukan" : "Pengeluaran"} (WIB)
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="cursor-pointer justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                        >
                          <Clock className="h-4 w-4 text-dl-primary" />
                          {trxTime} WIB
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Select
                          value={trxTime.slice(0, 2)}
                          onValueChange={(h) =>
                            setTrxTime(`${h}${trxTime.slice(2)}`)
                          }
                        >
                          <SelectTrigger className="w-20 cursor-pointer bg-white">
                            <SelectValue placeholder="Jam" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {hours.map((h) => (
                              <SelectItem
                                key={h}
                                value={h}
                                className="cursor-pointer"
                              >
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-dl-muted">:</span>
                        <Select
                          value={trxTime.slice(3)}
                          onValueChange={(m) =>
                            setTrxTime(`${trxTime.slice(0, 3)}${m}`)
                          }
                        >
                          <SelectTrigger className="w-20 cursor-pointer bg-white">
                            <SelectValue placeholder="Menit" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {minutes.map((m) => (
                              <SelectItem
                                key={m}
                                value={m}
                                className="cursor-pointer"
                              >
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              </div>
            </form>
          </Form>
          <DialogFooter className="z-10 border-t border-dl-border bg-white p-4 grid grid-cols-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button
              form="edit-transaction-form"
              type="submit"
              className="gap-2 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
              disabled={editTransaction.isPending}
            >
              {editTransaction.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dl-foreground">
              Hapus transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi {item.purpose} ({item.trxId}) akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTransaction.mutate({ id: item.id })}
              className="bg-dl-error text-white hover:bg-dl-error/90"
            >
              {deleteTransaction.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionActions;
