"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  NotebookPen,
  Receipt,
  Sparkles,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { UangPintarLogoNoBg } from "@/lib/images";
import { getPackageLabel } from "@/const/general/package-label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const navItems = [
  { label: "Beranda", href: "/user/dashboard", icon: Home },
  {
    label: "Catat Manual",
    href: "/user/manual-transaction",
    icon: NotebookPen,
  },
  {
    label: "Catat dengan AI",
    href: "/user",
    icon: Sparkles,
  },
  {
    label: "Riwayat Pembayaran",
    href: "/user/payment-history",
    icon: Receipt,
  },
  { label: "Profil", href: "/user/profile", icon: User },
];

const UserSidebarContent = ({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: Props) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const fullName = [session?.user?.firstName, session?.user?.lastName]
    .filter(Boolean)
    .join(" ");
  const displayName = fullName || "Uang Pintar AI";

  return (
    <>
      <div
        className={cn(
          "flex items-center py-5",
          collapsed ? "flex-col gap-3" : "gap-3 px-5",
        )}
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={UangPintarLogoNoBg}
            alt="Uang Pintar"
            fill
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold text-dl-foreground">
              Uang Pintar AI
            </p>
            <p className="text-[11px] font-medium text-dl-muted">
              Catat Keuanganmu
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
          className="h-8 w-8 shrink-0 rounded-md text-dl-muted transition-colors hover:bg-dl-cream hover:text-dl-primary"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                isActive
                  ? "bg-gradient-to-r from-dl-primary/10 to-dl-gradient-2/10 text-dl-primary"
                  : "text-dl-muted hover:bg-dl-cream hover:text-dl-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 h-5 w-1 rounded-r-full bg-gradient-to-b from-dl-gradient-2 to-dl-primary" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-dl-primary"
                    : "text-dl-muted group-hover:text-dl-primary",
                )}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-dl-border p-3">
        <div
          className={cn(
            "flex items-center rounded-lg px-3 py-2.5",
            collapsed ? "justify-center px-0" : "gap-3",
          )}
        >
          <Avatar className="size-7 shrink-0 bg-gradient-to-br from-dl-gradient-2 to-dl-primary">
            <AvatarFallback className="bg-transparent text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-dl-foreground">
                {displayName}
              </p>
              <Link
                href="/user/upgrade"
                onClick={onNavigate}
                aria-label="Upgrade paket"
                className="mt-1 inline-flex cursor-pointer"
              >
                <Badge
                  variant="blue"
                  className="truncate rounded-md text-[10px] transition-colors hover:bg-blue-100"
                >
                  {session?.user?.status
                    ? getPackageLabel(session.user.status)
                    : "AI"}
                </Badge>
              </Link>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Keluar"
              className="h-8 w-8 shrink-0 rounded-md text-dl-muted transition-colors hover:bg-dl-error/10 hover:text-dl-error"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default UserSidebarContent;
