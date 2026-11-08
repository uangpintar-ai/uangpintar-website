"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasBudgetingAccess } from "@/const/payment";

type Props = {
  children: React.ReactNode;
};

const BudgetGate = ({ children }: Props) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100dvh-96px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dl-primary" />
      </div>
    );
  }

  if (!hasBudgetingAccess(session?.user?.status)) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-xl flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dl-primary/10">
          <Lock className="h-7 w-7 text-dl-primary" />
        </div>
        <h1 className="text-xl font-bold text-dl-foreground">Budgeting</h1>
        <p className="max-w-sm text-sm text-dl-muted">
          Rencanakan transaksi bulananmu dengan fitur budgeting. Fitur ini
          tersedia untuk semua paket aktif.
        </p>
        <Button
          asChild
          className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
        >
          <Link href="/user/upgrade">Lihat Paket</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default BudgetGate;
