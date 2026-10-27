"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SessionProvider, signOut } from "next-auth/react";
import {
  Ellipsis,
  Home,
  LogOut,
  NotebookPen,
  Receipt,
  Sparkles,
  Tags,
  User,
  Wallet,
} from "lucide-react";
import UserSidebarContent from "./UserSidebarContent";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

const bottomNavItems = [
  { label: "Beranda", href: "/user/dashboard", icon: Home },
  {
    label: "Catat",
    href: "/user/manual-transaction",
    icon: NotebookPen,
  },
  { label: "Catat AI", href: "/user", icon: Sparkles, highlight: true },
  { label: "Profil", href: "/user/profile", icon: User },
];

const moreNavItems = [
  { label: "Dompet", href: "/user/wallets", icon: Wallet },
  { label: "Kategori", href: "/user/categories", icon: Tags },
  {
    label: "Riwayat Pembayaran",
    href: "/user/payment-history",
    icon: Receipt,
  },
];

const UserDashboardLayout = ({ children }: Props) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="flex min-h-dvh bg-dl-background">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-dl-border bg-white transition-all duration-200 md:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <UserSidebarContent
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((prev) => !prev)}
          />
        </aside>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-all duration-200",
            collapsed ? "md:pl-16" : "md:pl-60",
          )}
        >
          <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-8 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-dl-border bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;

          if ("highlight" in item && item.highlight && isActive) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-dl-primary"
              >
                <span className="-my-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-md shadow-dl-primary/40 transition-transform active:scale-95">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-dl-primary"
                  : "text-dl-muted hover:text-dl-foreground",
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "text-dl-primary")}
              />
              {item.label}
            </Link>
          );
        })}

        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                moreNavItems.some((item) => pathname === item.href)
                  ? "text-dl-primary"
                  : "text-dl-muted hover:text-dl-foreground",
              )}
            >
              <Ellipsis className="h-5 w-5" />
              Lainnya
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-48 p-1.5"
          >
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-dl-primary"
                      : "text-dl-muted hover:bg-dl-cream hover:text-dl-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-dl-muted transition-colors hover:bg-dl-error/10 hover:text-dl-error"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </PopoverContent>
        </Popover>
      </nav>
    </SessionProvider>
  );
};

export default UserDashboardLayout;
