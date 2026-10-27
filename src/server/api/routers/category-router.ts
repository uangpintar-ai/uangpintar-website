import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ensureDefaultCategory } from "@/server/services/category-service";

const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori harus diisi").max(50),
  icon: z.string().trim().min(1, "Icon harus dipilih").max(50),
});

export const categoryRouter = createTRPCRouter({
  findAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId!;
    await ensureDefaultCategory(ctx.db, userId);
    return ctx.db.transactionCategory.findMany({
      where: { userId },
      include: { _count: { select: { details: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }),

  create: protectedProcedure
    .input(categoryInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const existing = await ctx.db.transactionCategory.findFirst({
        where: { userId, name: input.name },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Nama kategori sudah digunakan",
        });
      }
      const last = await ctx.db.transactionCategory.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      await ctx.db.transactionCategory.create({
        data: {
          userId,
          name: input.name,
          icon: input.icon,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      });
    }),

  update: protectedProcedure
    .input(categoryInputSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const category = await ctx.db.transactionCategory.findFirst({
        where: { id: input.id, userId },
        select: { id: true },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kategori tidak ditemukan",
        });
      }
      const duplicate = await ctx.db.transactionCategory.findFirst({
        where: { userId, name: input.name, id: { not: input.id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Nama kategori sudah digunakan",
        });
      }
      await ctx.db.transactionCategory.update({
        where: { id: input.id },
        data: { name: input.name, icon: input.icon },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      await ctx.db.$transaction(
        async (tx) => {
          const category = await tx.transactionCategory.findFirst({
            where: { id: input.id, userId },
          });
          if (!category) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kategori tidak ditemukan",
            });
          }
          const categoryCount = await tx.transactionCategory.count({
            where: { userId },
          });
          if (categoryCount <= 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Minimal satu kategori harus tetap ada",
            });
          }
          const detailCount = await tx.transactionDetail.count({
            where: { categoryId: category.id },
          });
          if (detailCount > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Kategori masih digunakan oleh transaksi",
            });
          }
          await tx.transactionCategory.delete({ where: { id: category.id } });
        },
        { isolationLevel: "Serializable" },
      );
    }),
});
