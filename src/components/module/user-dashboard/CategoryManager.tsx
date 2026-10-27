"use client";

import { useState } from "react";
import type { TransactionCategory } from "@prisma/client";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  DEFAULT_CATEGORY_ICON,
  TRANSACTION_CATEGORY_ICONS,
  TransactionCategoryIcon,
} from "@/const/general/transaction-category-icons";

type Category = TransactionCategory & { _count: { details: number } };

const CategoryManager = () => {
  const utils = api.useUtils();
  const { data: categories, isLoading } = api.category.findAll.useQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setName("");
    setIcon(DEFAULT_CATEGORY_ICON);
  };

  const createCategory = api.category.create.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Kategori berhasil ditambahkan");
      closeForm();
      utils.category.findAll.invalidate();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Kategori berhasil diperbarui");
      closeForm();
      utils.category.findAll.invalidate();
      utils.transaction.findAll.invalidate();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Kategori berhasil dihapus");
      setDeleteTarget(null);
      utils.category.findAll.invalidate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
      setDeleteTarget(null);
    },
  });

  const isLastCategory = (categories?.length ?? 0) <= 1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dl-foreground">
            Kategori Transaksi
          </h1>
          <p className="text-sm text-dl-muted">
            Atur kategori dan icon untuk setiap rincian transaksi
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setName("");
            setIcon(DEFAULT_CATEGORY_ICON);
            setFormOpen(true);
          }}
          className="gap-2 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
            </div>
          ) : (
            <div className="divide-y divide-dl-border">
              {categories?.map((category) => {
                const isUsed = category._count.details > 0;
                const deleteDisabled = isLastCategory || isUsed;
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dl-primary/10 text-dl-primary">
                        <TransactionCategoryIcon
                          icon={category.icon}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-dl-foreground">
                          {category.name}
                        </p>
                        <p className="text-xs text-dl-muted">
                          {category._count.details} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTarget(category);
                          setName(category.name);
                          setIcon(category.icon);
                          setFormOpen(true);
                        }}
                        aria-label={`Edit ${category.name}`}
                        title="Edit kategori"
                        className="h-8 w-8 text-dl-muted hover:bg-dl-primary/10 hover:text-dl-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteDisabled}
                        onClick={() => setDeleteTarget(category)}
                        aria-label={`Hapus ${category.name}`}
                        title={
                          isLastCategory
                            ? "Minimal satu kategori harus tetap ada"
                            : isUsed
                              ? "Kategori masih digunakan oleh transaksi"
                              : "Hapus kategori"
                        }
                        className="h-8 w-8 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!isLoading && isLastCategory && (
            <p className="mt-4 border-t border-dl-border pt-3 text-xs text-dl-muted">
              Minimal satu kategori harus tetap ada.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dl-foreground">
              {editTarget ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              Pilih nama dan icon untuk kategori transaksi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Nama Kategori
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Makanan"
                maxLength={50}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dl-foreground">
                Icon
              </label>
              <div className="grid max-h-52 grid-cols-7 gap-2 overflow-y-auto rounded-lg border border-dl-border p-2">
                {TRANSACTION_CATEGORY_ICONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    onClick={() => setIcon(option.value)}
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center rounded-md border transition-colors",
                      icon === option.value
                        ? "border-slate-700 bg-slate-100 text-slate-900"
                        : "border-dl-border bg-white text-dl-muted hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <option.Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              disabled={
                !name.trim() ||
                createCategory.isPending ||
                updateCategory.isPending
              }
              onClick={() => {
                if (editTarget) {
                  updateCategory.mutate({
                    id: editTarget.id,
                    name: name.trim(),
                    icon,
                  });
                } else {
                  createCategory.mutate({ name: name.trim(), icon });
                }
              }}
              className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
            >
              {createCategory.isPending || updateCategory.isPending ? (
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dl-foreground">
              Hapus kategori?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Kategori {deleteTarget?.name} akan dihapus permanen. Kategori yang
              masih digunakan oleh transaksi tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteCategory.mutate({ id: deleteTarget.id })
              }
              className="bg-dl-error text-white hover:bg-dl-error/90"
            >
              {deleteCategory.isPending ? (
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

export default CategoryManager;
