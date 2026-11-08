"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bot,
  Loader2,
  Lock,
  Menu,
  Plus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn, formatDateWithTime } from "@/lib/utils";
import { toastError } from "@/lib/toast";
import { hasAnalysisAccess } from "@/const/payment";
import { api } from "@/trpc/react";

type ChatMessage = { role: "user" | "assistant"; content: string };

type SessionItem = {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
};

const suggestions = [
  "Bulan ini boros di mana?",
  "Bandingkan bulan ini dengan bulan lalu",
  "Evaluasi budgeting bulan ini",
  "Berapa sisa saldo saya?",
];

type SessionListProps = {
  sessions: SessionItem[] | undefined;
  isLoading: boolean;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onNew: () => void;
};

const SessionList = ({
  sessions,
  isLoading,
  selectedId,
  onSelect,
  onNew,
}: SessionListProps) => (
  <div className="flex h-full min-h-0 w-full flex-col px-3 pt-4 pb-3">
    <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-dl-muted uppercase">
      Riwayat Sesi
    </p>
    <Button
      onClick={onNew}
      className="mt-3 mb-4 w-full gap-1.5 bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-xs text-white"
    >
      <Plus className="h-4 w-4" />
      Sesi Baru
    </Button>
    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-dl-muted" />
        </div>
      ) : sessions?.length ? (
        sessions.map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full cursor-pointer rounded-md border px-3 py-2 text-left transition-colors",
                active
                  ? "border-dl-primary bg-dl-primary/5"
                  : "border-transparent hover:bg-dl-background",
              )}
            >
              <p
                className={cn(
                  "line-clamp-2 text-xs font-medium",
                  active ? "text-dl-primary" : "text-dl-foreground",
                )}
              >
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] text-dl-muted">
                {formatDateWithTime(item.updatedAt.toISOString())} ·{" "}
                {item.messageCount} pesan
              </p>
            </button>
          );
        })
      ) : (
        <p className="py-4 text-center text-xs text-dl-muted">Belum ada sesi</p>
      )}
    </div>
  </div>
);

const AnalysisChat = () => {
  const { data: session, status } = useSession();
  const canUse = hasAnalysisAccess(session?.user?.status);
  const utils = api.useUtils();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(undefined);
  const [isNewSession, setIsNewSession] = useState(false);
  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sessions = api.analysis.sessions.useQuery(undefined, {
    enabled: canUse,
  });
  const detail = api.analysis.detail.useQuery(
    { id: selectedSessionId ?? "" },
    { enabled: canUse && Boolean(selectedSessionId) },
  );

  useEffect(() => {
    if (!canUse || isNewSession || selectedSessionId) return;
    const latest = sessions.data?.[0];
    if (latest) setSelectedSessionId(latest.id);
  }, [canUse, isNewSession, selectedSessionId, sessions.data]);

  useEffect(() => {
    if (!detail.data) return;
    setMessages(
      detail.data.messages.map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      })),
    );
  }, [detail.data]);

  const chat = api.analysis.chat.useMutation({
    onSuccess: (result) => {
      setIsNewSession(false);
      setSelectedSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer },
      ]);
      void utils.analysis.sessions.invalidate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || chat.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    chat.mutate({ sessionId: selectedSessionId, message: content });
  };

  const startNewSession = () => {
    setIsNewSession(true);
    setSelectedSessionId(undefined);
    setMessages([]);
    setDrawerOpen(false);
  };

  const selectSession = (id: string) => {
    setIsNewSession(false);
    setSelectedSessionId(id);
    setMessages([]);
    setDrawerOpen(false);
  };

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100dvh-96px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dl-primary" />
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-xl flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dl-primary/10">
          <Lock className="h-7 w-7 text-dl-primary" />
        </div>
        <h1 className="text-xl font-bold text-dl-foreground">
          Analisis Keuangan AI
        </h1>
        <p className="max-w-sm text-sm text-dl-muted">
          Tanya jawab bebas soal keuanganmu tersedia khusus Paket Jago.
        </p>
        <Button
          asChild
          className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
        >
          <Link href="/user/upgrade">Upgrade ke Paket Jago</Link>
        </Button>
      </div>
    );
  }

  const isLoadingSession =
    sessions.isLoading || (Boolean(selectedSessionId) && detail.isLoading);
  const activeTitle = sessions.data?.find(
    (item) => item.id === selectedSessionId,
  )?.title;

  return (
    <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-5xl gap-4 sm:h-[calc(100dvh-104px)] md:h-[calc(100dvh-56px)] lg:h-[calc(100dvh-64px)]">
      <aside className="hidden w-64 shrink-0 overflow-hidden rounded-xl border border-dl-border bg-white md:flex">
        <SessionList
          sessions={sessions.data}
          isLoading={sessions.isLoading}
          selectedId={selectedSessionId}
          onSelect={selectSession}
          onNew={startNewSession}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex items-center gap-3 border-b border-dl-border pb-4">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Buka riwayat sesi"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-white p-0">
              <SheetTitle className="sr-only">Riwayat Sesi</SheetTitle>
              <SessionList
                sessions={sessions.data}
                isLoading={sessions.isLoading}
                selectedId={selectedSessionId}
                onSelect={selectSession}
                onNew={startNewSession}
              />
            </SheetContent>
          </Sheet>
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white sm:flex">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-dl-foreground">
              Analisis Keuangan AI
            </h1>
            <p className="truncate text-xs text-dl-muted">
              {activeTitle
                ? `Sesi: ${activeTitle}`
                : "Tanya jawab berdasarkan data transaksi yang kamu catat."}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {isLoadingSession ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-dl-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dl-primary/10">
                <Bot className="h-6 w-6 text-dl-primary" />
              </div>
              <p className="max-w-sm text-sm text-dl-muted">
                Tanyakan apa saja tentang pemasukan, pengeluaran, budgeting,
                kategori, atau saldo kamu. AI akan mengambil data yang relevan.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="cursor-pointer rounded-full border border-dl-border bg-white px-3 py-1.5 text-xs text-dl-foreground transition-colors hover:border-dl-primary/40 hover:text-dl-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    message.role === "assistant"
                      ? "bg-dl-primary/10 text-dl-primary"
                      : "bg-dl-foreground text-white",
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "assistant"
                      ? "rounded-tl-sm border border-dl-border bg-white text-dl-foreground"
                      : "rounded-tr-sm bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {chat.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dl-primary/10 text-dl-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-dl-border bg-white px-4 py-2.5 text-sm text-dl-muted">
                <Loader2 className="h-4 w-4 animate-spin text-dl-primary" />
                Menganalisis data...
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="border-t border-dl-border pt-3">
          <div className="rounded-xl border border-dl-border bg-white p-2 shadow-sm focus-within:border-dl-primary/40">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Contoh: bulan ini pengeluaran terbesar di kategori apa?"
              className="min-h-10 max-h-32 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0"
              rows={1}
              maxLength={500}
              disabled={chat.isPending || isLoadingSession}
            />
            <div className="mt-1 flex justify-end border-t border-dl-border/60 pt-2">
              <Button
                onClick={() => send()}
                disabled={!input.trim() || chat.isPending || isLoadingSession}
                className="h-9 shrink-0 gap-1.5 rounded-lg bg-gradient-to-r from-dl-gradient-2 to-dl-primary px-4 text-xs text-white"
                aria-label="Kirim pertanyaan"
              >
                <Send className="h-4 w-4" />
                Kirim
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisChat;
