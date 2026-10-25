"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PaymentDialog from "./PaymentDialog";

type Props = {
  link: string;
};

const ResumePaymentButton = ({ link }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-dl-border text-dl-foreground"
      >
        Lanjutkan Pembayaran
      </Button>
      {open && <PaymentDialog link={link} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ResumePaymentButton;
