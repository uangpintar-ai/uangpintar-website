import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasAnalysisAccess } from "@/const/payment";
import { toWibDate, WIB_OFFSET_MS } from "@/lib/utils";
import { answerFinancialQuestion } from "@/server/services/analysis-service";

const MAX_ANALYSIS_PER_DAY = 20;

const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(500),
});

const adminFilterSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
});

export const analysisRouter = createTRPCRouter({
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.aIAnalysisSession.findMany({
      where: { userId: ctx.session.userId! },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return rows.map(({ _count, ...session }) => ({
      ...session,
      messageCount: _count.messages,
    }));
  }),

  detail: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.db.aIAnalysisSession.findFirst({
        where: { id: input.id, userId: ctx.session.userId! },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 100,
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  chat: protectedProcedure
    .input(chatSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.userId! },
        select: { status: true },
      });
      if (!hasAnalysisAccess(user?.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Fitur analisis AI hanya tersedia di Paket Jago",
        });
      }

      const nowWib = toWibDate();
      const dayStart = new Date(
        Date.UTC(
          nowWib.getUTCFullYear(),
          nowWib.getUTCMonth(),
          nowWib.getUTCDate(),
        ) - WIB_OFFSET_MS,
      );
      const usedToday = await ctx.db.aIAnalysisMessage.count({
        where: {
          role: "user",
          createdAt: { gte: dayStart },
          session: { userId: ctx.session.userId! },
        },
      });
      if (usedToday >= MAX_ANALYSIS_PER_DAY) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Batas ${MAX_ANALYSIS_PER_DAY} pertanyaan per hari sudah tercapai`,
        });
      }

      let session = input.sessionId
        ? await ctx.db.aIAnalysisSession.findFirst({
            where: { id: input.sessionId, userId: ctx.session.userId! },
          })
        : null;
      if (!session) {
        session = await ctx.db.aIAnalysisSession.create({
          data: {
            userId: ctx.session.userId!,
            title: input.message.slice(0, 80),
          },
        });
      }

      const historyRows = await ctx.db.aIAnalysisMessage.findMany({
        where: { sessionId: session.id, role: { in: ["user", "assistant"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { role: true, content: true },
      });
      const history = historyRows.reverse().map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

      const result = await answerFinancialQuestion(
        ctx.session.userId!,
        input.message,
        history,
      );

      await ctx.db.aIAnalysisMessage.create({
        data: {
          sessionId: session.id,
          role: "user",
          content: input.message,
        },
      });
      await ctx.db.aIAnalysisMessage.create({
        data: {
          sessionId: session.id,
          role: "assistant",
          content: result.answer,
          toolCalls: result.toolLog as unknown as Prisma.InputJsonValue,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          cost: result.usage.cost,
        },
      });
      await ctx.db.aIAnalysisSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });

      return {
        sessionId: session.id,
        answer: result.answer,
        usage: result.usage,
      };
    }),

  findAllAdmin: protectedProcedure
    .input(adminFilterSchema)
    .query(async ({ input, ctx }) => {
      if (ctx.session.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where: Prisma.AIAnalysisSessionWhereInput = input.search
        ? {
            user: {
              OR: [
                { firstName: { contains: input.search, mode: "insensitive" } },
                { lastName: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            },
          }
        : {};

      const [rows, total] = await Promise.all([
        ctx.db.aIAnalysisSession.findMany({
          where,
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
            messages: { select: { cost: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.aIAnalysisSession.count({ where }),
      ]);

      return {
        items: rows.map(({ messages, ...session }) => ({
          ...session,
          messageCount: messages.length,
          totalCost: messages.reduce((sum, message) => sum + message.cost, 0),
        })),
        meta: {
          page: input.page,
          limit: input.limit,
          total_page: Math.ceil(total / input.limit),
          total_item: total,
        },
      };
    }),

  detailAdmin: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      if (ctx.session.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const session = await ctx.db.aIAnalysisSession.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),
});
