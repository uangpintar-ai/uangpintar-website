"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateWithTime } from "@/lib/utils";
import { useDebounced } from "@/lib/debounced";
import { api } from "@/trpc/react";

type ToolLog = {
  name: string;
  arguments: string;
  result: string;
};

const formatCost = (cost: number) => `$${cost.toFixed(6)}`;

const AnalysisData = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const search = useDebounced(searchInput);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data: list, isLoading } = api.analysis.findAllAdmin.useQuery({
    page,
    limit,
    search: search || undefined,
  });

  const { data: detail, isLoading: isLoadingDetail } =
    api.analysis.detailAdmin.useQuery(
      { id: selectedId ?? "" },
      { enabled: Boolean(selectedId) },
    );

  return (
    <div className="space-y-4">
      <Card className="border-dl-border bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-dl-foreground">
            Analisis Keuangan AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dl-muted" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama atau email user..."
              className="bg-white pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-dl-background">
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      User
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      Sesi
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      Pesan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      Biaya
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      Terakhir
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-dl-muted uppercase">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-dl-muted"
                      >
                        Belum ada riwayat analisis
                      </TableCell>
                    </TableRow>
                  ) : (
                    list?.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="text-sm font-medium text-dl-foreground">
                            {item.user.firstName} {item.user.lastName}
                          </p>
                          <p className="text-xs text-dl-muted">
                            {item.user.email}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-dl-foreground">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-sm text-dl-foreground">
                          {item.messageCount}
                        </TableCell>
                        <TableCell className="text-sm text-dl-foreground">
                          {formatCost(item.totalCost)}
                        </TableCell>
                        <TableCell className="text-xs text-dl-muted">
                          {formatDateWithTime(item.updatedAt.toISOString())}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-dl-muted">
              Menampilkan {list?.items.length ?? 0} dari{" "}
              {list?.meta.total_item ?? 0} sesi
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-dl-muted">
                {list?.meta.page ?? 1} / {list?.meta.total_page || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (list?.meta.total_page ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Analisis AI</DialogTitle>
            <DialogDescription>
              Riwayat pertanyaan, jawaban, tool, dan biaya.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail || !detail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-dl-muted" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-dl-border bg-dl-background p-3 text-sm">
                <p className="font-medium text-dl-foreground">
                  {detail.user.firstName} {detail.user.lastName}
                </p>
                <p className="text-xs text-dl-muted">{detail.user.email}</p>
                <p className="mt-1 text-xs text-dl-muted">
                  Dibuat {formatDateWithTime(detail.createdAt.toISOString())}
                </p>
              </div>

              {detail.messages.map((message) => {
                const tools = Array.isArray(message.toolCalls)
                  ? (message.toolCalls as unknown as ToolLog[])
                  : [];
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className="rounded-lg border border-dl-border p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge variant={isUser ? "blue" : "green"}>
                        {isUser ? "User" : "AI"}
                      </Badge>
                      <span className="text-[11px] text-dl-muted">
                        {formatDateWithTime(message.createdAt.toISOString())}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-sm text-dl-foreground">
                      {message.content}
                    </p>
                    {!isUser && (
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-dl-muted">
                        <span>
                          Token: {message.promptTokens} /{" "}
                          {message.completionTokens}
                        </span>
                        <span>Biaya: {formatCost(message.cost)}</span>
                      </div>
                    )}
                    {tools.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center gap-1 text-[11px] font-medium text-dl-muted">
                          <Wrench className="h-3 w-3" />
                          Tool ({tools.length})
                        </p>
                        {tools.map((tool, index) => (
                          <p
                            key={`${message.id}-${index}`}
                            className="rounded bg-dl-background px-2 py-1 text-[11px] text-dl-muted"
                          >
                            <span className="font-medium">{tool.name}</span>{" "}
                            {tool.arguments} → {tool.result}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisData;
