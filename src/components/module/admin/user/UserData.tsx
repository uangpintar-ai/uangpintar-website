"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateWithTime } from "@/lib/utils";
import { useDebounced } from "@/lib/debounced";
import { api } from "@/trpc/react";

const statusVariant: Record<
  string,
  "green" | "yellow" | "blue" | "destructive" | "secondary"
> = {
  UNVERIFIED: "yellow",
  GRATIS: "blue",
  PEMULA_BULANAN: "green",
  PEMULA_TAHUNAN: "green",
  PAKET_JAGO: "green",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

const statusLabel: Record<string, string> = {
  UNVERIFIED: "Belum Terverifikasi",
  GRATIS: "Gratis",
  PEMULA_BULANAN: "Pemula Bulanan",
  PEMULA_TAHUNAN: "Pemula Tahunan",
  PAKET_JAGO: "Paket Jago",
  INACTIVE: "Tidak Aktif",
  SUSPENDED: "Ditangguhkan",
};

const UserData = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data: list, isLoading } = api.user.findAll.useQuery({
    page,
    limit,
    name: search || undefined,
  });

  return (
    <div className="space-y-4">
      <Card className="border-dl-border bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-dl-foreground">
            Data User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dl-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama..."
              className="bg-white pl-9"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-dl-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>AI Session</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-dl-muted"
                    >
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : list && list.items.length > 0 ? (
                  list.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-dl-foreground">
                        {item.firstName} {item.lastName}
                      </TableCell>
                      <TableCell className="text-dl-muted">
                        {item.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="blue"
                          className="rounded-md text-[10px]"
                        >
                          {item.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[item.status] ?? "secondary"}
                          className="rounded-md text-[10px]"
                        >
                          {statusLabel[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-dl-foreground">
                        {formatDate(item.packageStart.toISOString())} -{" "}
                        {formatDate(item.packageRnd.toISOString())}
                      </TableCell>
                      <TableCell className="text-dl-foreground">
                        {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell className="text-dl-foreground">
                        {item.aiSessionCount}/{item.maxAISession}
                      </TableCell>
                      <TableCell className="text-dl-muted">
                        {formatDateWithTime(item.createdAt.toISOString())}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-dl-muted"
                    >
                      Tidak ada data user
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {list && list.meta.total_item > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
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
    </div>
  );
};

export default UserData;
