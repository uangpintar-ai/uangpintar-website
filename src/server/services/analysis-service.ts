import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { toWibDate, WIB_OFFSET_MS } from "@/lib/utils";
import type { TAIChatCompletionUsage } from "@/server/api/types/ai-type";
import {
  chatCompletionWithTools,
  type AIChatMessage,
  type AIChatTool,
  type AIChatToolCall,
} from "@/server/services/ai-service";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_TOOL_ROUNDS = 4;

const monthArg = z.string().regex(MONTH_RE).optional();
const typeArg = z.enum(["INCOME", "EXPENSE"]).optional();

const summarySchema = z.object({ month: monthArg });
const budgetSchema = z.object({ month: monthArg });
const categorySchema = z.object({ month: monthArg, type: typeArg });
const trendSchema = z.object({
  months: z.number().int().min(1).max(12).optional(),
  endMonth: monthArg,
});
const searchSchema = z.object({
  month: monthArg,
  category: z.string().max(80).optional(),
  type: typeArg,
  minAmount: z.number().nonnegative().optional(),
  query: z.string().max(80).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  sortBy: z.enum(["date", "amount"]).optional(),
});

const currentWib = () => toWibDate();

const monthInfo = (month?: string) => {
  const now = currentWib();
  let year = now.getUTCFullYear();
  let monthNumber = now.getUTCMonth() + 1;

  if (month && MONTH_RE.test(month)) {
    const [y, m] = month.split("-") as [string, string];
    year = Number(y);
    monthNumber = Number(m);
  }

  return {
    year,
    monthNumber,
    label: `${year}-${String(monthNumber).padStart(2, "0")}`,
    start: new Date(Date.UTC(year, monthNumber - 1, 1) - WIB_OFFSET_MS),
    end: new Date(Date.UTC(year, monthNumber, 1) - 1 - WIB_OFFSET_MS),
  };
};

const roundMoney = (value: number) => Math.round(value);

const getSummary = async (
  userId: string,
  args: z.infer<typeof summarySchema>,
) => {
  const info = monthInfo(args.month);
  const [transactions, user, wallets, budget] = await Promise.all([
    db.transaction.findMany({
      where: { userId, trxDate: { gte: info.start, lte: info.end } },
      select: { type: true, totalAmount: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    db.wallet.findMany({
      where: { userId },
      select: { name: true, balance: true },
      orderBy: { createdAt: "asc" },
    }),
    db.budget.findUnique({
      where: { userId_month: { userId, month: info.label } },
      include: { items: { select: { amount: true } } },
    }),
  ]);

  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (transaction.type === "INCOME") income += transaction.totalAmount;
    else expense += transaction.totalAmount;
  }

  const budgetPlanned =
    budget?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return {
    month: info.label,
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
    savingsRate:
      income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    transactionCount: transactions.length,
    totalBalance: roundMoney(user?.balance ?? 0),
    wallets: wallets.map((wallet) => ({
      name: wallet.name,
      balance: roundMoney(wallet.balance),
    })),
    budget: budget
      ? {
          plannedAmount: roundMoney(budgetPlanned),
          remaining: roundMoney(budgetPlanned - expense),
          overBudget: budgetPlanned > 0 ? expense > budgetPlanned : null,
        }
      : null,
  };
};

const getBudget = async (
  userId: string,
  args: z.infer<typeof budgetSchema>,
) => {
  const info = monthInfo(args.month);
  const [budget, expenses] = await Promise.all([
    db.budget.findUnique({
      where: { userId_month: { userId, month: info.label } },
      include: { items: { orderBy: { createdAt: "asc" } } },
    }),
    db.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        trxDate: { gte: info.start, lte: info.end },
      },
      select: { totalAmount: true },
    }),
  ]);

  const items = budget?.items ?? [];
  const plannedAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const actualExpense = expenses.reduce(
    (sum, transaction) => sum + transaction.totalAmount,
    0,
  );

  return {
    month: info.label,
    hasBudget: Boolean(budget),
    itemCount: items.length,
    plannedAmount: roundMoney(plannedAmount),
    actualExpense: roundMoney(actualExpense),
    remaining: roundMoney(plannedAmount - actualExpense),
    overBudget: plannedAmount > 0 ? actualExpense > plannedAmount : null,
    items: items.slice(0, 20).map((item) => ({
      name: item.name.slice(0, 80),
      amount: roundMoney(item.amount),
    })),
  };
};

const getCategoryBreakdown = async (
  userId: string,
  args: z.infer<typeof categorySchema>,
) => {
  const info = monthInfo(args.month);
  const rows = await db.transactionDetail.findMany({
    where: {
      transaction: {
        userId,
        trxDate: { gte: info.start, lte: info.end },
        ...(args.type ? { type: args.type } : {}),
      },
    },
    select: { amount: true, category: { select: { name: true } } },
  });

  const totals = new Map<string, { amount: number; count: number }>();
  for (const row of rows) {
    const name = row.category?.name ?? "Lainnya";
    const current = totals.get(name) ?? { amount: 0, count: 0 };
    current.amount += row.amount;
    current.count += 1;
    totals.set(name, current);
  }

  const total = Array.from(totals.values()).reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    month: info.label,
    type: args.type ?? "ALL",
    total: roundMoney(total),
    categories: Array.from(totals.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 10)
      .map(([name, value]) => ({
        name,
        amount: roundMoney(value.amount),
        count: value.count,
        percentage: total > 0 ? Math.round((value.amount / total) * 100) : 0,
      })),
  };
};

const getMonthlyTrend = async (
  userId: string,
  args: z.infer<typeof trendSchema>,
) => {
  const months = Math.min(Math.max(args.months ?? 6, 1), 12);
  const endInfo = monthInfo(args.endMonth);

  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(
      Date.UTC(endInfo.year, endInfo.monthNumber - 1 - i, 1),
    );
    keys.push(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }

  const start = monthInfo(keys[0]).start;
  const end = monthInfo(keys[keys.length - 1]).end;

  const rows = await db.transaction.findMany({
    where: { userId, trxDate: { gte: start, lte: end } },
    select: { type: true, totalAmount: true, trxDate: true },
  });

  const map = new Map(
    keys.map((key) => [key, { month: key, income: 0, expense: 0 }]),
  );
  for (const row of rows) {
    const wib = toWibDate(row.trxDate);
    const key = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
    const item = map.get(key);
    if (!item) continue;
    if (row.type === "INCOME") item.income += row.totalAmount;
    else item.expense += row.totalAmount;
  }

  return {
    months: Array.from(map.values()).map((item) => ({
      month: item.month,
      income: roundMoney(item.income),
      expense: roundMoney(item.expense),
      net: roundMoney(item.income - item.expense),
    })),
  };
};

const searchTransactions = async (
  userId: string,
  args: z.infer<typeof searchSchema>,
) => {
  const info = monthInfo(args.month);
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 20);

  const where: Prisma.TransactionWhereInput = {
    userId,
    trxDate: { gte: info.start, lte: info.end },
    ...(args.type ? { type: args.type } : {}),
    ...(args.minAmount ? { totalAmount: { gte: args.minAmount } } : {}),
    ...(args.category
      ? {
          details: {
            some: {
              category: {
                is: { name: { equals: args.category, mode: "insensitive" } },
              },
            },
          },
        }
      : {}),
    ...(args.query
      ? {
          OR: [
            {
              purpose: { contains: args.query, mode: "insensitive" as const },
            },
            {
              details: {
                some: {
                  name: { contains: args.query, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
  };

  const rows = await db.transaction.findMany({
    where,
    orderBy:
      args.sortBy === "amount" ? { totalAmount: "desc" } : { trxDate: "desc" },
    take: limit,
    include: {
      details: { include: { category: { select: { name: true } } } },
      wallet: { select: { name: true } },
    },
  });
  const total = await db.transaction.count({ where });

  return {
    month: info.label,
    total,
    count: rows.length,
    hasMore: total > rows.length,
    transactions: rows.map((transaction) => {
      const wib = toWibDate(transaction.trxDate);
      return {
        date: `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}-${String(wib.getUTCDate()).padStart(2, "0")}`,
        purpose: transaction.purpose.slice(0, 80),
        type: transaction.type,
        amount: roundMoney(transaction.totalAmount),
        wallet: transaction.wallet?.name ?? null,
        categories: Array.from(
          new Set(
            transaction.details
              .map((detail) => detail.category?.name)
              .filter((name): name is string => Boolean(name)),
          ),
        ),
      };
    }),
  };
};

export const ANALYSIS_TOOLS: AIChatTool[] = [
  {
    type: "function",
    function: {
      name: "get_summary",
      description:
        "Ringkasan pemasukan, pengeluaran, selisih, rasio tabungan, saldo dompet, dan ringkasan budgeting (jika ada) untuk satu bulan (YYYY-MM). Isi month kosong untuk bulan berjalan.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan format YYYY-MM" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_budget",
      description:
        "Ambil budgeting bulanan user: total rencana, pengeluaran aktual, sisa atau over budget, dan daftar transaksi yang direncanakan (maksimal 20). Isi month kosong untuk bulan berjalan.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan format YYYY-MM" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_category_breakdown",
      description:
        "Total pengeluaran/pemasukan per kategori pada satu bulan, diurutkan dari terbesar.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan format YYYY-MM" },
          type: {
            type: "string",
            enum: ["INCOME", "EXPENSE"],
            description: "Filter tipe transaksi",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_trend",
      description:
        "Tren pemasukan dan pengeluaran beberapa bulan terakhir (1-12 bulan), bisa diakhiri pada bulan tertentu.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description: "Jumlah bulan, default 6",
          },
          endMonth: {
            type: "string",
            description:
              "Bulan akhir format YYYY-MM, opsional. Kosongkan untuk bulan berjalan.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_transactions",
      description:
        "Cari transaksi detail pada satu bulan berdasarkan kategori, tipe, nominal minimum, atau kata kunci. Bisa urutkan berdasarkan tanggal atau nominal terbesar. Maksimal 20 baris.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan format YYYY-MM" },
          category: { type: "string", description: "Nama kategori" },
          type: {
            type: "string",
            enum: ["INCOME", "EXPENSE"],
            description: "Filter tipe transaksi",
          },
          minAmount: {
            type: "number",
            description: "Nominal minimum dalam Rupiah",
          },
          query: {
            type: "string",
            description: "Kata kunci keterangan/nama rincian",
          },
          limit: { type: "number", description: "Maksimal 20" },
          sortBy: {
            type: "string",
            enum: ["date", "amount"],
            description: "Urutkan berdasarkan tanggal atau nominal terbesar",
          },
        },
        additionalProperties: false,
      },
    },
  },
];

const executeTool = async (userId: string, call: AIChatToolCall) => {
  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(call.function.arguments || "{}");
  } catch {
    return { error: "Argumen tool tidak valid" };
  }

  try {
    switch (call.function.name) {
      case "get_summary":
        return await getSummary(userId, summarySchema.parse(rawArgs));
      case "get_budget":
        return await getBudget(userId, budgetSchema.parse(rawArgs));
      case "get_category_breakdown":
        return await getCategoryBreakdown(
          userId,
          categorySchema.parse(rawArgs),
        );
      case "get_monthly_trend":
        return await getMonthlyTrend(userId, trendSchema.parse(rawArgs));
      case "search_transactions":
        return await searchTransactions(userId, searchSchema.parse(rawArgs));
      default:
        return { error: "Tool tidak dikenal" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Parameter tool tidak valid" };
    }
    return {
      error: error instanceof Error ? error.message : "Gagal mengambil data",
    };
  }
};

const summarizeResult = (result: unknown) => {
  if (typeof result !== "object" || result === null) return "ok";
  const value = result as Record<string, unknown>;
  if ("error" in value) return String(value.error);
  if (typeof value.plannedAmount === "number")
    return `${value.itemCount ?? 0} item budget`;
  if (Array.isArray(value.categories))
    return `${value.categories.length} kategori`;
  if (Array.isArray(value.transactions))
    return `${value.transactions.length} transaksi`;
  if (Array.isArray(value.months)) return `${value.months.length} bulan`;
  return "ok";
};

export type AnalysisUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
};

export type AnalysisToolLog = {
  name: string;
  arguments: string;
  result: string;
};

const addUsage = (
  target: AnalysisUsage,
  usage: TAIChatCompletionUsage | null,
) => {
  if (!usage) return;
  target.promptTokens += usage.prompt_tokens ?? 0;
  target.completionTokens += usage.completion_tokens ?? 0;
  target.totalTokens += usage.total_tokens ?? 0;
  target.cost += usage.cost ?? 0;
};

const buildSystemPrompt = () => {
  const now = new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Jakarta",
  });
  return `Kamu adalah teman ngobrol yang paham keuangan di aplikasi Uang Pintar. Waktu sekarang: ${now} WIB.

Cara menjawab:
- Pakai bahasa Indonesia santai dan akrab. Sebut user "kamu", bukan "Anda".
- Tulis seperti chat biasa, bukan laporan. Jangan pakai heading, bold (**), tabel, atau tanda markdown lain.
- Jangan buka dengan "Berikut kondisi keuangan..." atau "Berdasarkan data...". Langsung jawab intinya.
- Cukup 1-2 paragraf pendek. Kalau perlu rincian, tulis maksimal 3 baris tanpa simbol bullet.
- Sebut hanya angka dan 1-2 temuan yang paling penting. Jangan mengulang semua data.
- Akhiri dengan satu saran praktis yang ringan, bukan ceramah.

Aturan data:
- Gunakan tool untuk mengambil data user. Jangan mengarang angka, kategori, atau transaksi.
- Selalu sebutkan periode data yang dipakai. Jika pertanyaan tidak menyebut periode, gunakan bulan berjalan.
- Kalau pertanyaan menyangkut budgeting, panggil get_budget. Bedakan rencana (plannedAmount) dari pengeluaran nyata (actualExpense).
- Jika data kosong, katakan bahwa data transaksi atau budgeting pada periode tersebut memang belum ada.
- Jangan menyebut nama tool, JSON, atau proses internal. Jangan memberi nasihat investasi/saham spesifik.
- Semua nominal dalam Rupiah.`;
};

const cleanAnswer = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const answerFinancialQuestion = async (
  userId: string,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
) => {
  const messages: AIChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history,
    { role: "user", content: question },
  ];
  const usage: AnalysisUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cost: 0,
  };
  const toolLog: AnalysisToolLog[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { message, usage: roundUsage } = await chatCompletionWithTools(
      messages,
      ANALYSIS_TOOLS,
    );
    addUsage(usage, roundUsage);

    const calls = message.tool_calls ?? [];
    if (calls.length === 0) {
      return {
        answer:
          cleanAnswer(message.content ?? "") ||
          "Maaf, saya belum bisa menjawab itu.",
        usage,
        toolLog,
      };
    }

    messages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const result = await executeTool(userId, call);
      toolLog.push({
        name: call.function.name,
        arguments: call.function.arguments,
        result: summarizeResult(result),
      });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  const { message, usage: finalUsage } = await chatCompletionWithTools(
    [
      ...messages,
      {
        role: "user",
        content:
          "Berikan jawaban akhir sekarang berdasarkan data yang sudah diambil. Jangan memanggil tool lagi.",
      },
    ],
    [],
  );
  addUsage(usage, finalUsage);

  return {
    answer:
      cleanAnswer(message.content ?? "") ||
      "Maaf, datanya terlalu banyak untuk dijawab sekarang. Coba tanya lebih spesifik, ya.",
    usage,
    toolLog,
  };
};
