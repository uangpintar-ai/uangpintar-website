import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ensureDefaultWallet } from "@/server/services/wallet-service";

const walletCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama dompet harus diisi").max(50),
});

export const walletRouter = createTRPCRouter({
  findAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId!;
    await ensureDefaultWallet(ctx.db, userId);
    return ctx.db.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }),

  create: protectedProcedure
    .input(walletCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const existing = await ctx.db.wallet.findFirst({
        where: { userId, name: input.name },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Nama dompet sudah digunakan",
        });
      }
      await ctx.db.wallet.create({ data: { userId, name: input.name } });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1, "Nama dompet harus diisi").max(50),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      const wallet = await ctx.db.wallet.findFirst({
        where: { id: input.id, userId },
        select: { id: true },
      });
      if (!wallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }
      const duplicate = await ctx.db.wallet.findFirst({
        where: { userId, name: input.name, id: { not: input.id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Nama dompet sudah digunakan",
        });
      }
      await ctx.db.wallet.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId!;
      await ctx.db.$transaction(
        async (tx) => {
          const wallet = await tx.wallet.findFirst({
            where: { id: input.id, userId },
          });
          if (!wallet) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Dompet tidak ditemukan",
            });
          }
          const walletCount = await tx.wallet.count({ where: { userId } });
          if (walletCount <= 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Minimal satu dompet harus tetap ada",
            });
          }
          const transactionCount = await tx.transaction.count({
            where: { walletId: wallet.id },
          });
          if (transactionCount > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Dompet masih memiliki transaksi",
            });
          }
          await tx.wallet.delete({ where: { id: wallet.id } });
        },
        { isolationLevel: "Serializable" },
      );
    }),
});
