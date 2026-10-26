import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import {
  CLASSIFY_MODEL,
  CLASSIFY_PROMPT,
  SYSTEM_PROMPT,
  chatCompletion,
  draftSummary,
  getOrCreateOpenSession,
  mentionsDate,
  parseAIReplyIntent,
  parseAIResponse,
  walletPrompt,
} from "@/server/services/ai-service";

const draftDetailSchema = z.object({
  name: z.string().nullable().optional(),
  amount: z.union([z.string(), z.number()]).nullable().optional(),
});

const draftSchema = z.object({
  category: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  details: z.array(draftDetailSchema).nullable().optional(),
  trxDate: z.string().nullable().optional(),
  trxTime: z.string().nullable().optional(),
});

const sendMessageSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt tidak boleh kosong")
    .max(200, "Prompt maksimal 200 karakter"),
  draft: draftSchema.optional(),
});

const classifyReplySchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt tidak boleh kosong")
    .max(200, "Prompt maksimal 200 karakter"),
  draft: draftSchema,
});

const transcribeSchema = z.object({
  audio: z.string().min(1, "Audio harus diisi"),
  format: z
    .enum(["wav", "mp3", "flac", "m4a", "ogg", "webm", "aac"])
    .default("wav"),
});

const sessionFilterSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

export const aiRouter = createTRPCRouter({
  getOrCreateSession: protectedProcedure.mutation(async ({ ctx }) => {
    const session = await getOrCreateOpenSession(ctx.db, ctx.session.userId);
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.userId! },
      select: { aiSessionCount: true, maxAISession: true },
    });
    return {
      session,
      aiSessionCount: user?.aiSessionCount ?? 0,
      maxAISession: user?.maxAISession ?? 0,
    };
  }),

  closeAndStartNewSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    await ctx.db.aIChatSession.updateMany({
      where: { userId: ctx.session.userId, status: "OPEN" },
      data: { status: "CLOSED" },
    });
    const session = await getOrCreateOpenSession(ctx.db, ctx.session.userId);
    const user = await ctx.db.user.update({
      where: { id: ctx.session.userId },
      data: { aiSessionCount: { increment: 1 } },
      select: { aiSessionCount: true },
    });
    return { session, aiSessionCount: user.aiSessionCount };
  }),

  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const session = await getOrCreateOpenSession(ctx.db, ctx.session.userId);

      const wallets = await ctx.db.wallet.findMany({
        where: { userId: ctx.session.userId! },
        select: { id: true, name: true },
        orderBy: { createdAt: "asc" },
      });

      const baseSystem = `${SYSTEM_PROMPT}\n\n${walletPrompt(wallets)}`;
      const systemContent = input.draft
        ? `${baseSystem}\n\nData transaksi sebelumnya (perbarui field yang disebut pengguna, lainnya biarkan):\n${draftSummary(input.draft)}`
        : baseSystem;

      const { content, usage } = await chatCompletion(
        [
          { role: "system", content: systemContent },
          { role: "user", content: input.prompt },
        ],
        "xiaomi/mimo-v2.6-flash",
      );

      const parsed = parseAIResponse(content);
      if (!mentionsDate(input.prompt)) {
        parsed.trxDate = null;
        parsed.trxTime = null;
      }
      const walletName = parsed.walletName?.trim().toLowerCase();
      parsed.walletId =
        wallets.find(
          (wallet) => wallet.name.trim().toLowerCase() === walletName,
        )?.id ?? null;

      await ctx.db.aIChatSessionDetail.create({
        data: {
          sessionId: session.id,
          prompt: input.prompt,
          response: parsed as unknown as Prisma.InputJsonValue,
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
          cost: usage?.cost ?? 0,
        },
      });

      return {
        data: parsed,
        usage,
      };
    }),

  classifyReply: protectedProcedure
    .input(classifyReplySchema)
    .mutation(async ({ input, ctx }) => {
      const { draft } = input;
      const summary = draftSummary(draft);

      const { content, usage } = await chatCompletion(
        [
          {
            role: "system",
            content: `${CLASSIFY_PROMPT}\n\nTransaksi tertunda:\n${summary}`,
          },
          { role: "user", content: input.prompt },
        ],
        CLASSIFY_MODEL,
      );

      const intent = parseAIReplyIntent(content);

      const session = await getOrCreateOpenSession(ctx.db, ctx.session.userId);
      await ctx.db.aIChatSessionDetail.create({
        data: {
          sessionId: session.id,
          prompt: input.prompt,
          response: { intent } as Prisma.InputJsonValue,
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
          cost: usage?.cost ?? 0,
        },
      });

      return { intent, usage };
    }),

  findAll: protectedProcedure
    .input(sessionFilterSchema)
    .query(async ({ input, ctx }) => {
      const where = {
        ...(input.search
          ? {
              OR: [
                { user: { firstName: { contains: input.search } } },
                { user: { lastName: { contains: input.search } } },
                { user: { email: { contains: input.search } } },
              ],
            }
          : {}),
        ...(input.startDate || input.endDate
          ? {
              createdAt: {
                ...(input.startDate ? { gte: input.startDate } : {}),
                ...(input.endDate ? { lte: input.endDate } : {}),
              },
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        ctx.db.aIChatSession.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            details: { select: { cost: true } },
            transcriptions: { select: { cost: true } },
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.aIChatSession.count({ where }),
      ]);
      const items = rows.map(({ details, transcriptions, ...session }) => {
        const aiCost = details.reduce((sum, d) => sum + d.cost, 0);
        const transcriptionCost = transcriptions.reduce(
          (sum, t) => sum + t.cost,
          0,
        );
        return {
          ...session,
          messageCount: details.length,
          transcriptionCount: transcriptions.length,
          aiCost,
          transcriptionCost,
          totalCost: aiCost + transcriptionCost,
        };
      });
      const [detailAgg, transcriptionAgg] = await Promise.all([
        ctx.db.aIChatSessionDetail.aggregate({
          where: { session: where },
          _sum: { cost: true },
        }),
        ctx.db.aIChatTranscription.aggregate({
          where: { session: where },
          _sum: { cost: true },
        }),
      ]);
      const summary = {
        aiCost: detailAgg._sum.cost ?? 0,
        transcriptionCost: transcriptionAgg._sum.cost ?? 0,
        totalCost:
          (detailAgg._sum.cost ?? 0) + (transcriptionAgg._sum.cost ?? 0),
      };
      return {
        items,
        summary,
        meta: {
          page: input.page,
          limit: input.limit,
          total_page: Math.ceil(total / input.limit),
          total_item: total,
        },
      };
    }),

  detail: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.db.aIChatSession.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          details: { orderBy: { createdAt: "asc" } },
          transcriptions: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  transcribe: protectedProcedure
    .input(transcribeSchema)
    .mutation(async ({ input, ctx }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const form = new FormData();
      form.append("model_id", "scribe_v2");
      form.append("language_code", "id");
      form.append(
        "file",
        new Blob([Buffer.from(input.audio, "base64")], {
          type: `audio/${input.format}`,
        }),
        `audio.${input.format}`,
      );

      let res: Response;
      try {
        res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: form,
        });
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal terhubung ke layanan transkripsi",
        });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Layanan transkripsi error: ${res.status}`,
        });
      }

      const data = (await res.json()) as {
        text?: string;
        audio_duration_secs?: number;
      };
      if (!data.text) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const usage = {
        seconds: data.audio_duration_secs ?? 0,
        cost: ((data.audio_duration_secs ?? 0) / 3600) * 0.22,
      };
      const session = await getOrCreateOpenSession(ctx.db, ctx.session.userId);
      await ctx.db.aIChatTranscription.create({
        data: {
          sessionId: session.id,
          text: data.text,
          seconds: usage.seconds,
          cost: usage.cost,
        },
      });

      return {
        text: data.text,
        usage,
      };
    }),
});
