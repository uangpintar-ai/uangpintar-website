"use client";

import { useState } from "react";
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
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  link: string | null;
  onClose: () => void;
};

const PaymentDialog = ({ link, onClose }: Props) => {
  const [confirmClose, setConfirmClose] = useState(false);

  return (
    <>
      <Dialog
        open={Boolean(link)}
        onOpenChange={(next) => {
          if (!next) setConfirmClose(true);
        }}
      >
        {link && (
          <DialogContent
            showCloseButton={false}
            className="h-[85vh] w-fit max-w-[calc(100vw-2rem)] gap-0 overflow-hidden border-0 bg-white p-0"
          >
            <DialogTitle className="sr-only">Pembayaran Mayar</DialogTitle>
            <DialogDescription className="sr-only">
              Halaman pembayaran Mayar
            </DialogDescription>
            <iframe
              src={link}
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
              onClick={() => {
                setConfirmClose(false);
                onClose();
              }}
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

export default PaymentDialog;
