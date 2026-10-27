"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Calculator,
  Clock,
  HelpCircle,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PiCalendarBlank,
  PiCalculator,
  PiFloppyDisk,
  PiPencilSimple,
  PiReceipt,
} from "react-icons/pi";
import { TransactionCategoryIcon } from "@/const/general/transaction-category-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import InputMoney from "@/components/shared/InputMoney";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateWithTime,
} from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import type { TAIResponse } from "@/server/api/types/ai-type";
import { api } from "@/trpc/react";

type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
  draft?: TransactionDraft;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "ai",
    content:
      'Halo! Saya asisten AI untuk mencatat pemasukan dan pengeluaranmu. Ceritakan saja, contoh: "Gaji bulanan masuk 5.000.000" atau "Beli sembako 150.000."',
  },
];

type TransactionDraft = Partial<TAIResponse>;

type CategoryOption = { id: string; name: string; icon: string };

const normalizeCategoryName = (name?: string | null) =>
  (name ?? "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findCategory = (
  categories: CategoryOption[] | undefined,
  name?: string | null,
) => {
  const target = normalizeCategoryName(name);
  return categories?.find(
    (category) => normalizeCategoryName(category.name) === target,
  );
};

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const toTimeInput = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const initialDraft = (): TransactionDraft => {
  const now = new Date();
  return {
    trxDate: toDateInput(now),
    trxTime: toTimeInput(now),
    details: [{ name: "", amount: "1" }],
  };
};

const MAX_SESSION_COST = 0.000315;
const MAX_VOICE_SECONDS = 35;
const MAX_VOICE_COST = (MAX_VOICE_SECONDS / 3600) * 0.22;

const draftDate = (data: Partial<TAIResponse>): Date | null => {
  if (!data.trxDate) return null;
  const date = new Date(`${data.trxDate}T${data.trxTime ?? "00:00"}`);
  return isNaN(date.getTime()) ? null : date;
};

const toAmount = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value ?? "").replace(/\D/g, "")) || 0;
};

const normalizeType = (value: unknown): "INCOME" | "EXPENSE" | null => {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "INCOME" || v === "EXPENSE") return v;
  if (v === "PEMASUKAN" || v === "MASUK") return "INCOME";
  if (v === "PENGELUARAN" || v === "KELUAR") return "EXPENSE";
  return null;
};

const getValidDetails = (data: Partial<TAIResponse>) =>
  (data.details ?? [])
    .map((d) => ({
      name: (d.name ?? "").trim(),
      amount: toAmount(d.amount),
      category: d.category?.trim() || null,
    }))
    .filter((d) => d.name.length > 0 && d.amount > 0);

const isComplete = (data: Partial<TAIResponse>) =>
  normalizeType(data.type) !== null &&
  !!data.purpose?.trim() &&
  getValidDetails(data).length > 0;

const snapshotDraft = (draft: TransactionDraft): TransactionDraft => ({
  ...draft,
  details: draft.details?.map((d) => ({ ...d })),
});

const mergeResponse = (
  draft: TransactionDraft,
  response: Partial<TAIResponse>,
) => {
  for (const [key, value] of Object.entries(response)) {
    if (value !== null && value !== undefined) {
      (draft as Record<string, unknown>)[key] = value;
    }
  }
};

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

type DraftEditModalProps = {
  draft: TransactionDraft;
  categories: CategoryOption[];
  walletOptions: { value: string; label: string }[];
  walletId: string;
  onClose: () => void;
  onSave: (draft: TransactionDraft, walletId: string) => void;
};

const DraftEditModal = ({
  draft,
  categories,
  walletOptions,
  walletId,
  onClose,
  onSave,
}: DraftEditModalProps) => {
  const initialDate = draftDate(draft) ?? new Date();
  const [wallet, setWallet] = useState(walletId);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    draft.type === "INCOME" ? "INCOME" : "EXPENSE",
  );
  const [purpose, setPurpose] = useState(draft.purpose ?? "");
  const [details, setDetails] = useState<
    { name: string; amount: string; categoryId: string }[]
  >(
    draft.details && draft.details.length > 0
      ? draft.details.map((d) => ({
          name: d.name ?? "",
          amount: d.amount != null ? String(d.amount) : "",
          categoryId: findCategory(categories, d.category)?.id ?? "",
        }))
      : [{ name: "", amount: "", categoryId: categories[0]?.id ?? "" }],
  );
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(toTimeInput(initialDate));

  const total = details.reduce(
    (sum, d) => sum + (Number(String(d.amount).replace(/\D/g, "")) || 0),
    0,
  );

  const updateDetail = (
    index: number,
    patch: Partial<{ name: string; amount: string; categoryId: string }>,
  ) =>
    setDetails((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );

  const addDetail = () =>
    setDetails((prev) => [
      ...prev,
      { name: "", amount: "", categoryId: categories[0]?.id ?? "" },
    ]);

  const removeDetail = (index: number) =>
    setDetails((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );

  const canSave =
    purpose.trim().length > 0 &&
    details.length > 0 &&
    details.every((d) => d.name.trim().length > 0 && Number(d.amount) > 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white sm:max-w-2xl !p-0 overflow-hidden flex flex-col justify-between">
        <DialogHeader className="z-10 border-b border-dl-border bg-white p-4 text-left">
          <DialogTitle className="text-dl-foreground">
            Edit Transaksi
          </DialogTitle>
          <DialogDescription>
            Perbarui detail sebelum mencatat transaksi
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 flex-1 overflow-auto px-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-dl-foreground">Dompet</p>
            <Combobox
              options={walletOptions}
              value={wallet}
              onChange={(value) => value && setWallet(value)}
              placeholder="Pilih dompet"
              searchPlaceholder="Cari dompet..."
              emptyText="Dompet tidak ditemukan"
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-dl-foreground">
              Tipe Transaksi
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  type === "INCOME"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-dl-border bg-white text-dl-muted hover:border-dl-border/60",
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  type === "EXPENSE"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-dl-border bg-white text-dl-muted hover:border-dl-border/60",
                )}
              >
                <TrendingDown className="h-4 w-4" />
                Pengeluaran
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-dl-foreground">Keterangan</p>
            <Textarea
              rows={2}
              placeholder="Keterangan transaksi"
              className="resize-none bg-white"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-dl-foreground">Rincian</p>
            {details.map((detail, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-dl-border bg-dl-background/60 p-3 sm:flex-row sm:items-start sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div className="flex items-center justify-between sm:hidden">
                  <span className="text-xs font-semibold text-dl-muted">
                    Rincian {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={details.length === 1}
                    onClick={() => removeDetail(index)}
                    aria-label="Hapus rincian"
                    className="h-8 w-8 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:contents">
                  <Input
                    placeholder="Nama rincian"
                    className="w-full bg-white sm:flex-1"
                    value={detail.name}
                    onChange={(e) =>
                      updateDetail(index, { name: e.target.value })
                    }
                  />
                  <div className="w-full sm:w-44 sm:flex-none">
                    <Combobox
                      options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                        icon: (
                          <TransactionCategoryIcon
                            icon={category.icon}
                            className="h-4 w-4 shrink-0"
                          />
                        ),
                      }))}
                      value={detail.categoryId}
                      onChange={(value) =>
                        value && updateDetail(index, { categoryId: value })
                      }
                      placeholder="Pilih kategori"
                      searchPlaceholder="Cari kategori..."
                      emptyText="Kategori tidak ditemukan"
                      className="bg-white"
                    />
                  </div>
                  <div className="w-full sm:w-40 sm:flex-none">
                    <InputMoney
                      placeholder="50000"
                      value={detail.amount}
                      onChange={(v: string) =>
                        updateDetail(index, { amount: v })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={details.length === 1}
                    onClick={() => removeDetail(index)}
                    aria-label="Hapus rincian"
                    className="mt-0.5 hidden shrink-0 text-dl-muted hover:bg-dl-error/10 hover:text-dl-error sm:inline-flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDetail}
              className="h-10 w-full gap-2 border-dashed border-dl-border text-dl-muted sm:h-8 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Tambah Rincian
            </Button>
            <div className="flex items-center justify-between rounded-xl border border-dl-border bg-white px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-dl-muted">
                <Calculator className="h-4 w-4 text-dl-primary" />
                Total
              </span>
              <span className="text-base font-bold text-dl-foreground">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-dl-foreground">
              Tanggal {type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                >
                  <CalendarDays className="h-4 w-4 text-dl-primary" />
                  {date ? formatDate(date.toISOString()) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto bg-white p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="bg-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-dl-foreground">
              Jam {type === "INCOME" ? "Pemasukan" : "Pengeluaran"} (WIB)
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-dl-border bg-white text-left font-normal text-dl-foreground"
                >
                  <Clock className="h-4 w-4 text-dl-primary" />
                  {time} WIB
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto bg-white p-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={time.slice(0, 2)}
                    onValueChange={(h) => setTime(`${h}${time.slice(2)}`)}
                  >
                    <SelectTrigger className="w-20 cursor-pointer bg-white">
                      <SelectValue placeholder="Jam" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {hours.map((h) => (
                        <SelectItem
                          key={h}
                          value={h}
                          className="cursor-pointer"
                        >
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-dl-muted">:</span>
                  <Select
                    value={time.slice(3)}
                    onValueChange={(m) => setTime(`${time.slice(0, 3)}${m}`)}
                  >
                    <SelectTrigger className="w-20 cursor-pointer bg-white">
                      <SelectValue placeholder="Menit" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {minutes.map((m) => (
                        <SelectItem
                          key={m}
                          value={m}
                          className="cursor-pointer"
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="z-10 border-t border-dl-border bg-white p-4 grid grid-cols-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() =>
              onSave(
                {
                  ...draft,
                  type,
                  purpose: purpose.trim(),
                  details: details.map((d) => ({
                    name: d.name.trim(),
                    amount: d.amount,
                    category:
                      categories.find((c) => c.id === d.categoryId)?.name ??
                      null,
                  })),
                  trxDate: toDateInput(date),
                  trxTime: time,
                },
                wallet,
              )
            }
            disabled={!canSave}
            className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white"
          >
            <Save className="h-4 w-4" />
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type TransactionCardProps = {
  draft: TransactionDraft;
  categories: CategoryOption[];
  showActions: boolean;
  saving: boolean;
  onSave: () => void;
  onEdit: () => void;
};

const TransactionCard = ({
  draft,
  categories,
  showActions,
  saving,
  onSave,
  onEdit,
}: TransactionCardProps) => {
  const type = normalizeType(draft.type);
  const isIncome = type === "INCOME";
  const details = (draft.details ?? []).filter(
    (d) => d.name || d.amount != null,
  );
  const total = details.reduce((sum, d) => sum + toAmount(d.amount), 0);
  const date = draftDate(draft);

  return (
    <div className="min-w-0 max-w-[80%] flex-1 rounded-xl border border-dl-border bg-white p-2 shadow-sm sm:p-3">
      <p className="text-xs font-semibold text-dl-foreground">
        Berikut catatan transaksi kamu:
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
              isIncome
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            <PiReceipt />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-dl-muted">Keterangan</p>
            <p className="text-xs font-bold break-words text-dl-foreground">
              {draft.purpose || "-"}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            isIncome
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          )}
        >
          {isIncome ? (
            <TrendingUp className="h-3 w-3 shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 shrink-0" />
          )}
          <span className="break-words whitespace-normal">
            {type ? (isIncome ? "Pemasukan" : "Pengeluaran") : "-"}
          </span>
        </span>
      </div>

      {details.length > 0 && (
        <>
          <div className="mt-2 rounded-lg bg-dl-background p-1.5">
            <p className="mb-1 px-1.5 text-[10px] text-dl-muted">Rincian</p>
            <div className="space-y-1">
              {details.map((detail, index) => {
                const category = findCategory(categories, detail.category);
                const categoryName =
                  category?.name ?? (detail.category?.trim() || "Lainnya");
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md bg-white px-2 py-1"
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs",
                        isIncome
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700",
                      )}
                    >
                      <TransactionCategoryIcon icon={category?.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold break-words text-dl-foreground">
                        {detail.name || "-"}
                      </p>
                      <p className="text-[10px] text-dl-muted">
                        {categoryName}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] font-bold tabular-nums text-dl-foreground">
                      {formatCurrency(toAmount(detail.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "mt-1.5 flex items-center justify-between rounded-lg px-3 py-2",
              isIncome ? "bg-emerald-50" : "bg-rose-50",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-bold",
                isIncome ? "text-emerald-700" : "text-rose-700",
              )}
            >
              <PiCalculator className="h-3.5 w-3.5" />
              <span>Total</span>
            </span>
            <span
              className={cn(
                "text-sm font-extrabold",
                isIncome ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </>
      )}

      <div className="mt-1.5 rounded-lg bg-dl-background px-3 py-1.5">
        <p className="flex items-center gap-1 text-[10px] text-dl-muted">
          <PiCalendarBlank className="h-3 w-3" />
          Tanggal
        </p>
        <p className="mt-0.5 text-[11px] text-dl-foreground">
          {date ? formatDateWithTime(date.toISOString()) : "-"}
        </p>
      </div>

      {showActions && (
        <>
          <p className="mt-2 text-xs text-dl-foreground">
            Apakah kamu mau catat transaksinya?
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <Button
              onClick={onSave}
              disabled={saving}
              className="h-9 w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-xs text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <PiFloppyDisk className="h-3.5 w-3.5" />
                  Ya, Catat
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              disabled={saving}
              className="h-9 w-full text-xs"
            >
              <PiPencilSimple className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const AIChatRoom = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: wallets } = api.wallet.findAll.useQuery();
  const { data: categories } = api.category.findAll.useQuery();
  const isFreeTier = session?.user?.status === "GRATIS";
  const [walletId, setWalletId] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionCost, setSessionCost] = useState(0);
  const [voiceCost, setVoiceCost] = useState(0);
  const [aiSessionCount, setAiTransactionCount] = useState(0);
  const [maxSession, setMaxSession] = useState(50);
  const aiResponseRef = useRef<TransactionDraft>(initialDraft());
  const [, setDraftTick] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(initialMessages.length);
  const [isRecording, setIsRecording] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [usedVoiceSeconds, setUsedVoiceSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceSecondsRef = useRef(0);
  const cancelRecordingRef = useRef(false);

  const pushMessage = (message: Omit<Message, "id">) => {
    idRef.current += 1;
    setMessages((prev) => [...prev, { ...message, id: idRef.current }]);
  };

  const getOrCreateSession = api.ai.getOrCreateSession.useMutation({
    onSuccess: (result) => {
      const session = result.session;
      setAiTransactionCount(result.aiSessionCount);
      setMaxSession(result.maxAISession);
      let lastId = 1;
      const draft = initialDraft();
      const loaded: Message[] = [...initialMessages];
      for (const detail of session.details) {
        const response = detail.response as unknown as TAIResponse;
        mergeResponse(draft, {
          ...response,
          type: response.type ?? response.category ?? null,
        });
        loaded.push({ id: ++lastId, role: "user", content: detail.prompt });
        loaded.push({
          id: ++lastId,
          role: "ai",
          content: "",
          draft: snapshotDraft(draft),
        });
      }
      aiResponseRef.current = draft;
      if (draft.walletId) setWalletId(draft.walletId);
      idRef.current = lastId;
      setMessages(loaded);
      setSessionCost(session.details.reduce((sum, d) => sum + d.cost, 0));
      const usedVoiceSeconds = session.transcriptions.reduce(
        (sum, t) => sum + t.seconds,
        0,
      );
      setVoiceCost(session.transcriptions.reduce((sum, t) => sum + t.cost, 0));
      voiceSecondsRef.current = usedVoiceSeconds;
      setUsedVoiceSeconds(usedVoiceSeconds);
      setDraftTick((t) => t + 1);
      setLoading(false);
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    getOrCreateSession.mutate();
  }, []);

  useEffect(() => {
    if (wallets?.length && !walletId) {
      setWalletId(wallets[0]!.id);
    }
  }, [wallets, walletId]);

  const sendMessage = api.ai.sendMessage.useMutation({
    onSuccess: (result) => {
      mergeResponse(aiResponseRef.current, result.data);
      if (result.data.walletId) setWalletId(result.data.walletId);
      setSessionCost((c) => c + (result.usage?.cost ?? 0));
      pushMessage({
        role: "ai",
        content: "",
        draft: snapshotDraft(aiResponseRef.current),
      });
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const classifyReply = api.ai.classifyReply.useMutation({
    onSuccess: (result, variables) => {
      setSessionCost((c) => c + (result.usage?.cost ?? 0));
      if (result.intent === "SAVE") {
        saveDraft();
        return;
      }
      sendMessage.mutate({
        prompt: variables.prompt,
        draft: aiResponseRef.current,
      });
    },
    onError: (_error, variables) => {
      sendMessage.mutate({
        prompt: variables.prompt,
        draft: aiResponseRef.current,
      });
    },
  });

  const transcribe = api.ai.transcribe.useMutation({
    onSuccess: (result) => {
      setInput(result.text);
      setVoiceCost((c) => c + (result.usage?.cost ?? 0));
      toastSuccess("Berhasil!", "Audio berhasil diubah menjadi teks");
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const processAudio = async (blob: Blob): Promise<string> => {
    const targetRate = 16000;
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(await blob.arrayBuffer());
    await audioCtx.close();
    const offCtx = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * targetRate),
      targetRate,
    );
    const source = offCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offCtx.destination);
    source.start();
    const rendered = await offCtx.startRendering();
    const channel = rendered.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < channel.length; i++)
      peak = Math.max(peak, Math.abs(channel[i]!));
    const gain = peak > 0 ? 0.9 / peak : 1;
    const pcm = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++)
      pcm[i] = Math.max(
        -32768,
        Math.min(32767, Math.round(channel[i]! * gain * 32768)),
      );
    const buffer = new ArrayBuffer(44 + pcm.byteLength);
    const view = new DataView(buffer);
    const writeString = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++)
        view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + pcm.byteLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, pcm.byteLength, true);
    new Int16Array(buffer, 44).set(pcm);
    return blobToBase64(new Blob([buffer], { type: "audio/wav" }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          toastError(
            "Dibatalkan!",
            `Maksimal ${MAX_VOICE_SECONDS} detik per sesi`,
          );
          return;
        }
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        transcribe.mutate({ audio: await processAudio(blob), format: "wav" });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      cancelRecordingRef.current = false;
      recordingTimerRef.current = setInterval(() => {
        voiceSecondsRef.current += 1;
        setUsedVoiceSeconds(voiceSecondsRef.current);
        if (voiceSecondsRef.current >= MAX_VOICE_SECONDS) {
          cancelRecordingRef.current = true;
          mediaRecorderRef.current?.stop();
        }
      }, 1000);
      recordingTimeoutRef.current = setTimeout(
        () => {
          cancelRecordingRef.current = true;
          mediaRecorderRef.current?.stop();
        },
        (MAX_VOICE_SECONDS - voiceSecondsRef.current) * 1000,
      );
      setIsRecording(true);
    } catch {
      toastError("Gagal!", "Mikrofon tidak tersedia atau ditolak");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending, classifyReply.isPending]);

  const resetSession = api.ai.closeAndStartNewSession.useMutation({
    onSuccess: (result) => {
      aiResponseRef.current = initialDraft();
      setMessages(initialMessages);
      setSessionCost(0);
      setVoiceCost(0);
      setAiTransactionCount(result.aiSessionCount);
      voiceSecondsRef.current = 0;
      setUsedVoiceSeconds(0);
      setDraftTick((t) => t + 1);
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const createTransaction = api.transaction.create.useMutation({
    onSuccess: () => {
      toastSuccess("Berhasil!", "Pencatatan berhasil dibuat");
      setEditOpen(false);
      resetSession.mutate();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const isDraftComplete = isComplete(aiResponseRef.current);

  const energyPct = Math.min(sessionCost / MAX_SESSION_COST, 1);
  const energyExhausted = sessionCost >= MAX_SESSION_COST;
  const voiceEnergyPct = Math.min(voiceCost / MAX_VOICE_COST, 1);

  const remainingVoice = Math.max(MAX_VOICE_SECONDS - usedVoiceSeconds, 0);
  const voiceExhausted = remainingVoice <= 0;

  const saveDraft = () => {
    const type = normalizeType(aiResponseRef.current.type);
    const purpose = aiResponseRef.current.purpose?.trim();
    const details = getValidDetails(aiResponseRef.current);
    if (!type || !purpose || details.length === 0) {
      toastError("Gagal!", "Data transaksi belum lengkap atau tidak valid");
      return;
    }
    createTransaction.mutate({
      type,
      purpose,
      details: details.map((detail) => ({
        name: detail.name,
        amount: detail.amount,
        categoryId: findCategory(categories, detail.category)?.id,
      })),
      trx_date: draftDate(aiResponseRef.current) ?? new Date(),
      walletId: walletId || undefined,
    });
  };

  const send = () => {
    const content = input.trim();
    if (
      !content ||
      sendMessage.isPending ||
      createTransaction.isPending ||
      classifyReply.isPending
    )
      return;
    pushMessage({ role: "user", content });
    setInput("");
    if (isDraftComplete) {
      classifyReply.mutate({ prompt: content, draft: aiResponseRef.current });
      return;
    }
    sendMessage.mutate({ prompt: content, draft: aiResponseRef.current });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-96px)] items-center justify-center sm:h-[calc(100dvh-104px)] md:h-[calc(100dvh-56px)] lg:h-[calc(100dvh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-dl-primary" />
      </div>
    );
  }

  if (aiSessionCount >= maxSession) {
    if (isFreeTier) {
      return (
        <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-xl flex-col items-center justify-center gap-4 text-center sm:h-[calc(100dvh-104px)] md:h-[calc(100dvh-56px)] lg:h-[calc(100dvh-64px)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dl-primary/10">
            <Sparkles className="h-7 w-7 text-dl-primary" />
          </div>
          <h2 className="text-xl font-bold text-dl-foreground">
            Jatah AI gratis kamu sudah habis
          </h2>
          <p className="max-w-sm text-sm text-dl-muted">
            Kamu sudah menggunakan {aiSessionCount} sesi chat AI hari ini.
            Upgrade paketmu untuk terus mencatat dengan bantuan AI.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
          >
            Upgrade Paket
          </Button>
        </div>
      );
    }

    return (
      <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-xl flex-col items-center justify-center gap-4 text-center sm:h-[calc(100dvh-104px)] md:h-[calc(100dvh-56px)] lg:h-[calc(100dvh-64px)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dl-error/10">
          <AlertTriangle className="h-7 w-7 text-dl-error" />
        </div>
        <h2 className="text-xl font-bold text-dl-foreground">
          Jatah AI kamu sudah habis untuk hari ini
        </h2>
        <p className="max-w-sm text-sm text-dl-muted">
          Kamu sudah menggunakan {aiSessionCount} sesi chat AI hari ini. Lakukan
          pencatatan manual untuk tetap mencatat pemasukan dan pengeluaranmu.
        </p>
        <Button
          onClick={() => router.push("/user/manual-transaction")}
          className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
        >
          Ke Pencatatan Manual
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-96px)] w-full max-w-3xl flex-col sm:h-[calc(100dvh-104px)] md:h-[calc(100dvh-56px)] lg:h-[calc(100dvh-64px)]">
      <div className="mb-4 border-b border-dl-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-dl-foreground">
              Asisten Pencatatan AI
            </h1>
            <p className="text-sm font-medium text-dl-primary">
              Sesi AI: {aiSessionCount}/{maxSession}
            </p>
          </div>
        </div>
        <div className="mt-3 w-full space-y-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-dl-muted">
              <div className="flex items-center gap-1.5">
                <span>Energi AI Chat</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Info energi AI"
                      className="cursor-pointer shrink-0 p-0.5 flex justify-center items-center place-items-center rounded-full bg-dl-primary/10 text-dl-primary transition-colors hover:bg-dl-primary hover:text-white"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="bg-white text-sm text-dl-foreground sm:w-80 mr-2"
                  >
                    AI sudah mengeluarkan {Math.round(energyPct * 100)}% energi
                    untuk sesi ini. Jangan sampai kehabisan tenaga 😴
                    <br />
                    <br />
                    Kalau energinya habis, cukup buat sesi chat baru untuk
                    lanjut mencatat.
                  </PopoverContent>
                </Popover>
              </div>
              <span>{Math.round(energyPct * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dl-border">
              <div
                className="h-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary transition-all duration-300"
                style={{ width: `${energyPct * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-dl-muted">
              <div className="flex items-center gap-1.5">
                <span>Energi Voice</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Info energi voice"
                      className="cursor-pointer shrink-0 p-0.5 flex justify-center items-center place-items-center rounded-full bg-dl-primary/10 text-dl-primary transition-colors hover:bg-dl-primary hover:text-white"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="bg-white text-sm text-dl-foreground sm:w-80 mr-2"
                  >
                    Voice sudah mengeluarkan {Math.round(voiceEnergyPct * 100)}%
                    energi untuk sesi ini.
                    <br />
                    <br />
                    Kalau energinya habis, rekaman suara tidak bisa digunakan,
                    tapi chat AI tetap bisa dipakai.
                  </PopoverContent>
                </Popover>
              </div>
              <span>{Math.round(voiceEnergyPct * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dl-border">
              <div
                className="h-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary transition-all duration-300"
                style={{ width: `${voiceEnergyPct * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((message, i) => {
          const isLast = i === messages.length - 1;
          if (message.role === "ai" && message.draft) {
            return (
              <div key={message.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dl-primary/10 text-dl-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <TransactionCard
                  draft={message.draft}
                  categories={categories ?? []}
                  showActions={isLast && isComplete(message.draft)}
                  saving={createTransaction.isPending}
                  onSave={saveDraft}
                  onEdit={() => setEditOpen(true)}
                />
              </div>
            );
          }
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "ai"
                    ? "bg-dl-primary/10 text-dl-primary"
                    : "bg-dl-foreground text-white",
                )}
              >
                {message.role === "ai" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "ai"
                    ? "rounded-tl-sm border border-dl-border bg-white text-dl-foreground"
                    : "rounded-tr-sm bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white",
                )}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {(sendMessage.isPending || classifyReply.isPending) && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dl-primary/10 text-dl-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-dl-border bg-white px-4 py-2.5 text-sm text-dl-muted">
              <Loader2 className="h-4 w-4 animate-spin text-dl-primary" />
              AI sedang memproses...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {energyExhausted ? (
        <div className="border-t border-dl-border pt-3">
          <Button
            onClick={() => {
              resetSession.mutate();
              toastSuccess("Sesi Baru!", "Sesi chat baru telah dibuat");
            }}
            disabled={resetSession.isPending}
            className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
          >
            {resetSession.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Buat Sesi Baru
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-dl-muted">
            Energi AI habis untuk sesi ini. Buat sesi baru untuk lanjut.
          </p>
        </div>
      ) : (
        <div className="border-t border-dl-border pt-3">
          <div className="flex items-end gap-2">
            {isRecording ? (
              <div className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-lg border border-dl-error/30 bg-dl-error/5">
                <span className="mr-2 text-xs font-medium text-dl-error">
                  Merekam...
                </span>
                {[0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84].map(
                  (delay, i) => (
                    <div
                      key={i}
                      className="dl-wave-bar h-6 w-1 rounded-full bg-dl-error"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ),
                )}
              </div>
            ) : transcribe.isPending ? (
              <div className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-dl-primary/20 bg-dl-primary/5">
                <Loader2 className="h-4 w-4 animate-spin text-dl-primary" />
                <span className="text-xs font-medium text-dl-primary">
                  Memproses audio...
                </span>
              </div>
            ) : (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Gaji masuk 5.000.000"
                className="min-h-12 max-h-32 flex-1 resize-none bg-white text-sm"
                rows={1}
                maxLength={200}
              />
            )}
            {!voiceExhausted && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={transcribe.isPending}
                className={cn(
                  "h-12 w-12 shrink-0 transition-all duration-300",
                  isRecording
                    ? "bg-dl-error text-white shadow-lg shadow-dl-error/40 animate-pulse"
                    : "bg-dl-primary/10 text-dl-primary hover:bg-dl-primary/20",
                )}
                aria-label={isRecording ? "Berhenti merekam" : "Rekam suara"}
              >
                {transcribe.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              onClick={send}
              disabled={
                !input.trim() ||
                sendMessage.isPending ||
                classifyReply.isPending ||
                createTransaction.isPending
              }
              className="h-12 shrink-0 aspect-square bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110"
              aria-label="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {editOpen && (
        <DraftEditModal
          draft={{ ...aiResponseRef.current }}
          categories={categories ?? []}
          walletOptions={
            wallets?.map((wallet) => ({
              value: wallet.id,
              label: `${wallet.name} - ${formatCurrency(wallet.balance)}`,
            })) ?? []
          }
          walletId={walletId}
          onClose={() => setEditOpen(false)}
          onSave={(draft, nextWalletId) => {
            aiResponseRef.current = draft;
            setWalletId(nextWalletId);
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === prev.length - 1
                  ? { ...m, draft: snapshotDraft(draft) }
                  : m,
              ),
            );
            setDraftTick((t) => t + 1);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AIChatRoom;
