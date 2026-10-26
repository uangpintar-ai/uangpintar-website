import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  transactionChartSchema,
  transactionCreateSchema,
  transactionFilterSchema,
  transactionSummarySchema,
  transactionUpdateSchema,
} from "@/schema/transaction-schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/server/services/transaction-service";

export const transactionRouter = createTRPCRouter({
  findAll: protectedProcedure
    .input(transactionFilterSchema)
    .query(async ({ input, ctx }) => {
      const dateFilter = {
        ...(input.start_date ? { gte: input.start_date } : {}),
        ...(input.end_date ? { lte: input.end_date } : {}),
      };
      const where = {
        userId: ctx.session.userId,
        ...(input.date_type === "created"
          ? { createdAt: dateFilter }
          : { trxDate: dateFilter }),
        ...(input.search
          ? {
              OR: [
                {
                  trxId: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  purpose: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  details: {
                    some: {
                      name: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.walletIds?.length
          ? { walletId: { in: input.walletIds } }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.transaction.findMany({
          where,
          include: {
            details: { orderBy: { createdAt: "asc" } },
            wallet: { select: { name: true } },
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.transaction.count({ where }),
      ]);
      return {
        items,
        meta: {
          page: input.page,
          limit: input.limit,
          total_page: Math.ceil(total / input.limit),
          total_item: total,
        },
      };
    }),

  findAllAdmin: protectedProcedure
    .input(transactionFilterSchema)
    .query(async ({ input, ctx }) => {
      const where = {
        trxDate: {
          ...(input.start_date ? { gte: input.start_date } : {}),
          ...(input.end_date ? { lte: input.end_date } : {}),
        },
        ...(input.search
          ? {
              OR: [
                {
                  trxId: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  purpose: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  user: {
                    OR: [
                      { firstName: { contains: input.search } },
                      { lastName: { contains: input.search } },
                      { email: { contains: input.search } },
                    ],
                  },
                },
              ],
            }
          : {}),
        ...(input.category ? { category: input.category } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.transaction.findMany({
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
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.transaction.count({ where }),
      ]);
      return {
        items,
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
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.id, userId: ctx.session.userId },
        include: { details: { orderBy: { createdAt: "asc" } } },
      });
      if (!transaction) throw new TRPCError({ code: "NOT_FOUND" });
      return transaction;
    }),

  summary: protectedProcedure
    .input(transactionSummarySchema)
    .query(async ({ input, ctx }) => {
      const where = {
        userId: ctx.session.userId,
        trxDate: {
          ...(input.start_date ? { gte: input.start_date } : {}),
          ...(input.end_date ? { lte: input.end_date } : {}),
        },
        ...(input.category ? { category: input.category } : {}),
        ...(input.walletIds?.length
          ? { walletId: { in: input.walletIds } }
          : {}),
      };
      const [transactions, user, wallets] = await Promise.all([
        ctx.db.transaction.findMany({
          where,
          select: { totalAmount: true, category: true },
        }),
        ctx.db.user.findUnique({
          where: { id: ctx.session.userId },
          select: { balance: true },
        }),
        input.walletIds?.length
          ? ctx.db.wallet.aggregate({
              where: {
                userId: ctx.session.userId,
                id: { in: input.walletIds },
              },
              _sum: { balance: true },
            })
          : null,
      ]);
      const income = transactions.filter((t) => t.category === "INCOME");
      const expense = transactions.filter((t) => t.category === "EXPENSE");
      return {
        balance: input.walletIds?.length
          ? (wallets?._sum.balance ?? 0)
          : (user?.balance ?? 0),
        income: {
          nominal: income.reduce((sum, t) => sum + t.totalAmount, 0),
          quantity: income.length,
        },
        expense: {
          nominal: expense.reduce((sum, t) => sum + t.totalAmount, 0),
          quantity: expense.length,
        },
      };
    }),

  chart: protectedProcedure
    .input(transactionChartSchema)
    .query(async ({ input, ctx }) => {
      const transactions = await ctx.db.transaction.findMany({
        where: {
          userId: ctx.session.userId,
          trxDate: {
            ...(input.start_date ? { gte: input.start_date } : {}),
            ...(input.end_date ? { lte: input.end_date } : {}),
          },
        },
        orderBy: { trxDate: "asc" },
        select: { trxDate: true, totalAmount: true },
      });
      const map = new Map<string, number>();
      for (const t of transactions) {
        const mm = String(t.trxDate.getMonth() + 1).padStart(2, "0");
        const dd = String(t.trxDate.getDate()).padStart(2, "0");
        const label =
          input.group_by === "month"
            ? `${t.trxDate.getFullYear()}-${mm}`
            : `${t.trxDate.getFullYear()}-${mm}-${dd}`;
        map.set(label, (map.get(label) ?? 0) + t.totalAmount);
      }
      return Array.from(map, ([label, revenue]) => ({ label, revenue }));
    }),

  create: protectedProcedure
    .input(transactionCreateSchema)
    .mutation(async ({ input, ctx }) => {
      await createTransaction(ctx.session.userId!, input);
    }),

  update: protectedProcedure
    .input(transactionUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await updateTransaction(
        ctx.session.userId!,
        input.id,
        input,
      );
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await deleteTransaction(ctx.session.userId!, input.id);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
    }),
});
