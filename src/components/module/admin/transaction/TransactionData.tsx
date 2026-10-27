"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  formatDateWithTime,
  formatStandardNumber,
} from "@/lib/utils";
import { useDebounced } from "@/lib/debounced";
import { api } from "@/trpc/react";

const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DateFilterInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-[160px] justify-start gap-2 border-dl-border bg-white text-left text-sm font-normal text-dl-foreground"
        >
          <CalendarDays className="h-4 w-4 text-dl-primary" />
          {date ? formatDate(date.toISOString()) : "Pilih tanggal"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto bg-white p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? toDateInput(d) : "")}
          className="bg-white"
        />
      </PopoverContent>
    </Popover>
  );
};

const monthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateInput(start), end: toDateInput(end) };
};

const typeVariant: Record<
  string,
  "green" | "yellow" | "blue" | "destructive" | "secondary"
> = {
  INCOME: "green",
  EXPENSE: "destructive",
};

const typeLabel: Record<string, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
};

const TransactionData = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "all">("all");
  const initial = monthBounds();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);

  useEffect(() => {
    setPage(1);
  }, [search, type, startDate, endDate]);

  const { data: list, isLoading } = api.transaction.findAllAdmin.useQuery({
    page,
    limit,
    search: search || undefined,
    type: type === "all" ? undefined : type,
    start_date: startDate ? new Date(startDate) : undefined,
    end_date: endDate ? new Date(endDate) : undefined,
  });

  return (
    <div className="space-y-4">
      <Card className="border-dl-border bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-dl-foreground">
            Data Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dl-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari trx id, keterangan, nama/email user..."
              className="bg-white pl-9"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as "INCOME" | "EXPENSE" | "all")
              }
            >
              <SelectTrigger className="h-9 w-[160px] cursor-pointer bg-white text-sm">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  Semua Tipe
                </SelectItem>
                <SelectItem value="INCOME" className="cursor-pointer">
                  Pemasukan
                </SelectItem>
                <SelectItem value="EXPENSE" className="cursor-pointer">
                  Pengeluaran
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dl-muted">Dari</span>
              <DateFilterInput value={startDate} onChange={setStartDate} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dl-muted">Sampai</span>
              <DateFilterInput value={endDate} onChange={setEndDate} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-white text-xs"
              onClick={() => {
                const bounds = monthBounds();
                setStartDate(bounds.start);
                setEndDate(bounds.end);
              }}
            >
              Reset
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-dl-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trx ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe Transaksi</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-dl-muted"
                    >
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : list && list.items.length > 0 ? (
                  list.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-dl-foreground">
                        {item.trxId}
                      </TableCell>
                      <TableCell className="text-dl-foreground">
                        {item.user.firstName} {item.user.lastName}
                      </TableCell>
                      <TableCell className="text-dl-muted">
                        {item.user.email}
                      </TableCell>
                      <TableCell className="text-dl-muted">
                        {formatDateWithTime(item.trxDate.toISOString())}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeVariant[item.type] ?? "secondary"}
                          className="rounded-md text-[10px]"
                        >
                          {typeLabel[item.type] ?? item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-dl-muted">
                        {item.purpose}
                      </TableCell>
                      <TableCell
                        className={
                          item.type === "INCOME"
                            ? "text-right font-medium text-dl-foreground"
                            : "text-right font-medium text-dl-error"
                        }
                      >
                        {item.type === "INCOME" ? "+" : "-"}Rp{" "}
                        {formatStandardNumber(item.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-dl-muted"
                    >
                      Tidak ada data transaksi
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

export default TransactionData;
