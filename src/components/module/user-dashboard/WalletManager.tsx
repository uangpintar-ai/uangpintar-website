"use client";

import { useState } from "react";
import type { Wallet } from "@prisma/client";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";

const WalletManager = () => {
  const utils = api.useUtils();
  const { data: wallets, isLoading } = api.wallet.findAll.useQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setName("");
  };

  const createWallet = api.wallet.create.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Dompet berhasil ditambahkan");
      closeForm();
      utils.wallet.findAll.invalidate();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const updateWallet = api.wallet.update.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Dompet berhasil diperbarui");
      closeForm();
      utils.wallet.findAll.invalidate();
    },
    onError: (error) => toastError("Gagal!", error.message),
  });

  const deleteWallet = api.wallet.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Dompet berhasil dihapus");
      setDeleteTarget(null);
      utils.wallet.findAll.invalidate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
      setDeleteTarget(null);
    },
  });

  const isLastWallet = (wallets?.length ?? 0) <= 1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dl-foreground">Dompet</h1>
          <p className="text-sm text-dl-muted">
            Kelola dompet untuk memisahkan saldo keuanganmu
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setName("");
            setFormOpen(true);
          }}
          className="gap-2 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Dompet
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
              {wallets?.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dl-primary/10 text-dl-primary">
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dl-foreground">
                        {wallet.name}
                      </p>
                      <p className="text-xs text-dl-muted">
                        {formatCurrency(wallet.balance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditTarget(wallet);
                        setName(wallet.name);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${wallet.name}`}
                      title="Edit dompet"
                      className="h-8 w-8 text-dl-muted hover:bg-dl-primary/10 hover:text-dl-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isLastWallet}
                      onClick={() => setDeleteTarget(wallet)}
                      aria-label={`Hapus ${wallet.name}`}
                      title={
                        isLastWallet
                          ? "Minimal satu dompet harus tetap ada"
                          : "Hapus dompet"
                      }
                      className="h-8 w-8 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && isLastWallet && (
            <p className="mt-4 border-t border-dl-border pt-3 text-xs text-dl-muted">
              Minimal satu dompet harus tetap ada.
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
              {editTarget ? "Edit Dompet" : "Tambah Dompet"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Ubah nama dompet."
                : "Beri nama dompet baru, misalnya Tunai, BCA, atau OVO."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dl-foreground">
              Nama Dompet
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA"
              maxLength={50}
              className="bg-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              disabled={
                !name.trim() || createWallet.isPending || updateWallet.isPending
              }
              onClick={() => {
                if (editTarget) {
                  updateWallet.mutate({
                    id: editTarget.id,
                    name: name.trim(),
                  });
                } else {
                  createWallet.mutate({ name: name.trim() });
                }
              }}
              className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
            >
              {createWallet.isPending || updateWallet.isPending ? (
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
              Hapus dompet?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dompet {deleteTarget?.name} akan dihapus permanen. Dompet yang
              masih memiliki transaksi tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteWallet.mutate({ id: deleteTarget.id })
              }
              className="bg-dl-error text-white hover:bg-dl-error/90"
            >
              {deleteWallet.isPending ? (
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

export default WalletManager;
