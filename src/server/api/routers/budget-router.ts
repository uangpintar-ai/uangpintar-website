import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { hasBudgetingAccess } from "@/const/payment";
import { toWibDate, WIB_OFFSET_MS } from "@/lib/utils";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Bulan tidak valid");

const roundMoney = (value: number) => Math.round(value);

const monthRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    start: new Date(Date.UTC(year!, monthNumber! - 1, 1) - WIB_OFFSET_MS),
    end: new Date(Date.UTC(year!, monthNumber!, 1) - 1 - WIB_OFFSET_MS),
  };
};

const itemSchema = z.object({
  name: z.string().trim().min(1, "Nama transaksi harus diisi").max(100),
  amount: z.number().int().positive("Nominal harus lebih dari 0"),
});

const budgetingProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.userId! },
    select: { status: true },
  });

  if (!hasBudgetingAccess(user?.status)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Fitur budgeting tersedia untuk semua paket aktif",
    });
  }

  return next();
});

export const budgetRouter = createTRPCRouter({
  overview: budgetingProcedure
    .input(z.object({ year: z.number().int().min(2000).max(2100) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const yearStart = new Date(Date.UTC(input.year, 0, 1) - WIB_OFFSET_MS);
      const yearEnd = new Date(
        Date.UTC(input.year + 1, 0, 1) - 1 - WIB_OFFSET_MS,
      );
      const [budgets, transactions] = await Promise.all([
        ctx.db.budget.findMany({
          where: { userId, month: { startsWith: `${input.year}-` } },
          include: {
            items: { select: { amount: true } },
          },
        }),
        ctx.db.transaction.findMany({
          where: {
            userId,
            type: "EXPENSE",
            trxDate: { gte: yearStart, lte: yearEnd },
          },
          select: { trxDate: true, totalAmount: true },
        }),
      ]);
      const byMonth = new Map(
        budgets.map((budget) => [budget.month, budget.items]),
      );
      const actualByMonth = new Map<
        string,
        { amount: number; count: number }
      >();

      for (const transaction of transactions) {
        const wib = toWibDate(transaction.trxDate);
        const key = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
        const current = actualByMonth.get(key) ?? { amount: 0, count: 0 };
        current.amount += transaction.totalAmount;
        current.count += 1;
        actualByMonth.set(key, current);
      }

      return Array.from({ length: 12 }, (_, index) => {
        const month = `${input.year}-${String(index + 1).padStart(2, "0")}`;
        const items = byMonth.get(month) ?? [];
        const actual = actualByMonth.get(month);

        return {
          month,
          itemCount: items.length,
          plannedAmount: roundMoney(
            items.reduce((sum, item) => sum + item.amount, 0),
          ),
          actualExpense: roundMoney(actual?.amount ?? 0),
          transactionCount: actual?.count ?? 0,
        };
      });
    }),

  comparison: budgetingProcedure
    .input(z.object({ month: monthSchema }))
    .query(async ({ input, ctx }) => {
      const { start, end } = monthRange(input.month);
      const where = {
        userId: ctx.session.userId!,
        type: "EXPENSE" as const,
        trxDate: { gte: start, lte: end },
      };
      const [aggregate, transactions] = await Promise.all([
        ctx.db.transaction.aggregate({
          where,
          _sum: { totalAmount: true },
          _count: true,
        }),
        ctx.db.transaction.findMany({
          where,
          orderBy: { trxDate: "desc" },
          take: 10,
          select: {
            id: true,
            purpose: true,
            trxDate: true,
            totalAmount: true,
          },
        }),
      ]);

      return {
        month: input.month,
        actualExpense: roundMoney(aggregate._sum.totalAmount ?? 0),
        transactionCount: aggregate._count,
        transactions: transactions.map((transaction) => ({
          ...transaction,
          totalAmount: roundMoney(transaction.totalAmount),
        })),
      };
    }),

  findByMonth: budgetingProcedure
    .input(z.object({ month: monthSchema }))
    .query(async ({ input, ctx }) => {
      return ctx.db.budget.findUnique({
        where: {
          userId_month: { userId: ctx.session.userId!, month: input.month },
        },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });
    }),

  createItem: budgetingProcedure
    .input(itemSchema.extend({ month: monthSchema }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const budget = await ctx.db.budget.upsert({
        where: { userId_month: { userId, month: input.month } },
        update: {},
        create: { userId, month: input.month },
        select: { id: true },
      });

      await ctx.db.budgetItem.create({
        data: {
          budgetId: budget.id,
          name: input.name,
          amount: input.amount,
        },
      });
    }),

  updateItem: budgetingProcedure
    .input(itemSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.db.budgetItem.findFirst({
        where: { id: input.id, budget: { userId: ctx.session.userId! } },
        select: { id: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaksi budgeting tidak ditemukan",
        });
      }

      await ctx.db.budgetItem.update({
        where: { id: item.id },
        data: { name: input.name, amount: input.amount },
      });
    }),

  deleteItem: budgetingProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.db.budgetItem.findFirst({
        where: { id: input.id, budget: { userId: ctx.session.userId! } },
        select: { id: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaksi budgeting tidak ditemukan",
        });
      }

      await ctx.db.budgetItem.delete({ where: { id: item.id } });
    }),

  copyToMonth: budgetingProcedure
    .input(
      z.object({
        sourceMonth: monthSchema,
        targetMonth: monthSchema,
        itemIds: z
          .array(z.string().min(1))
          .min(1, "Pilih minimal satu transaksi"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;

      if (input.sourceMonth === input.targetMonth) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bulan tujuan harus berbeda",
        });
      }

      const source = await ctx.db.budget.findUnique({
        where: { userId_month: { userId, month: input.sourceMonth } },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });

      if (!source || source.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Belum ada transaksi untuk disalin",
        });
      }

      const selected = source.items.filter((item) =>
        input.itemIds.includes(item.id),
      );

      if (selected.length !== input.itemIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sebagian transaksi tidak ditemukan",
        });
      }

      const existing = await ctx.db.budget.findUnique({
        where: {
          userId_month: { userId, month: input.targetMonth },
        },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Budgeting bulan tujuan sudah ada",
        });
      }

      await ctx.db.budget.create({
        data: {
          userId,
          month: input.targetMonth,
          items: {
            create: selected.map(({ name, amount }) => ({ name, amount })),
          },
        },
      });

      return { month: input.targetMonth };
    }),
});
