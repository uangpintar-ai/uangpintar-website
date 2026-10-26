import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import type {
  TAIChatCompletionUsage,
  TAIReplyIntent,
  TAIResponse,
} from "@/server/api/types/ai-type";

const wib = new Date().toLocaleString("sv-SE", {
  timeZone: "Asia/Jakarta",
});

export const SYSTEM_PROMPT = `Waktu: ${wib} (WIB). Ubah transaksi menjadi JSON saja:
{"category":"INCOME"|"EXPENSE"|null,"purpose":string|null,"details":[{"name":string,"amount":number}],"trxDate":"YYYY-MM-DD"|null,"trxTime":"HH:mm"|null,"walletName":string|null}
INCOME=masuk, EXPENSE=keluar. details berisi rincian item (nama + nominal), null jika tak disebut. amount angka tanpa format (50000). Isi trxDate/trxTime HANYA jika pengguna menyebut tanggal atau jam secara eksplisit; selain itu null. Jangan mengarang tanggal. Waktu relatif ke sekarang.`;

const DATE_HINT =
  /\b(\d{1,2}[-/.]\d{1,2}([-/.]\d{2,4})?|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}:\d{2}|hari ini|kemarin|tadi|lusa|besok|minggu|senin|selasa|rabu|kamis|jumat|sabtu|tanggal|tgl|pukul|jam|tahun|bulan|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i;

export const mentionsDate = (prompt: string) => DATE_HINT.test(prompt);

export const walletPrompt = (wallets: { id: string; name: string }[]) =>
  [
    "Daftar dompet pengguna:",
    ...(wallets.length > 0
      ? wallets.map((wallet) => `- ${wallet.name}`)
      : ["- (belum ada dompet)"]),
    'Jika pengguna menyebut dompet (contoh: "di BCA"), isi "walletName" dengan nama dompet persis dari daftar di atas. Jika tidak disebut atau tidak ada yang cocok, isi null.',
  ].join("\n");

export const CLASSIFY_PROMPT = `Tentukan intent balasan atas transaksi tertunda. Balas HANYA JSON:
{"intent":"SAVE"} jika setuju menyimpan tanpa maksud lain.
{"intent":"CONVERSATION"} untuk info baru, koreksi, pertanyaan, penolakan, atau lainnya. Ragu -> CONVERSATION.`;

export const CLASSIFY_MODEL = "xiaomi/mimo-v2.6-flash";

export const draftSummary = (draft: {
  category?: string | null;
  purpose?: string | null;
  details?: { name?: string | null; amount?: string | number | null }[] | null;
}) =>
  [
    `Kategori: ${
      draft.category === "INCOME"
        ? "Pemasukan"
        : draft.category === "EXPENSE"
          ? "Pengeluaran"
          : "-"
    }`,
    `Keterangan: ${draft.purpose ?? "-"}`,
    `Rincian:`,
    ...(draft.details && draft.details.length > 0
      ? draft.details.map((d) => `- ${d.name ?? "-"}: ${d.amount ?? "-"}`)
      : ["-"]),
  ].join("\n");

export const chatCompletion = async (
  messages: { role: "system" | "user"; content: string }[],
  model = "xiaomi/mimo-v2.6-flash",
  maxTokens = 200,
): Promise<{
  content: string;
  usage: TAIChatCompletionUsage | null;
}> => {
  const apiKey = process.env.OPENROUTER;
  if (!apiKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.2,
        reasoning: { effort: "none" },
      }),
    });
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Gagal terhubung ke layanan AI",
    });
  }

  if (!res.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Layanan AI error: ${res.status}`,
    });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: TAIChatCompletionUsage;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  return { content, usage: data.usage ?? null };
};

export const getOrCreateOpenSession = async (
  db: PrismaClient,
  userId: string | undefined,
) => {
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const existing = await db.aIChatSession.findFirst({
    where: { userId, status: "OPEN" },
    include: {
      details: { orderBy: { createdAt: "asc" } },
      transcriptions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (existing) return existing;
  return db.aIChatSession.create({
    data: { userId },
    include: { details: true, transcriptions: true },
  });
};

export const parseAIReplyIntent = (content: string): TAIReplyIntent => {
  let intent: TAIReplyIntent = "CONVERSATION";
  try {
    const parsed = JSON.parse(content) as { intent?: string };
    if (parsed.intent === "SAVE") intent = "SAVE";
  } catch {
    intent = "CONVERSATION";
  }
  return intent;
};

export const parseAIResponse = (content: string): TAIResponse => {
  try {
    return JSON.parse(content) as TAIResponse;
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Respons AI tidak valid",
    });
  }
};
