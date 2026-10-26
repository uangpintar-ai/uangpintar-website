import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  changePasswordSchema,
  changePasswordVerifySchema,
  registerSchema,
  resendChangePasswordCodeSchema,
  resendRegisterCodeSchema,
  userDeleteSchema,
  userFilterSchema,
  userUpdateSchema,
  verifyCodeSchema,
} from "@/schema/user-schema";
import { sendVerificationCode } from "@/lib/mailer";
import {
  deleteVerificationCode,
  getVerificationCode,
  saveVerificationCode,
  verificationKey,
} from "@/lib/redis";
import { randomInt } from "crypto";
import z from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { DEFAULT_WALLET_NAME } from "@/server/services/wallet-service";

const generateCode = () => randomInt(100000, 999999).toString();

const getBaseUrl = () =>
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT ?? 3000}`;

const sendAndStoreCode = async ({
  type,
  identifier,
  to,
}: {
  type: "register" | "change_password";
  identifier: string;
  to: string;
}) => {
  const code = generateCode();
  await saveVerificationCode(verificationKey(type, identifier), code);
  const link =
    type === "change_password"
      ? `${getBaseUrl()}/update-password?code=${code}&user_id=${encodeURIComponent(identifier)}`
      : undefined;
  await sendVerificationCode({ to, code, type, link });
};

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const hash = await bcrypt.hash(input.password, 10);
        const phone = input.phone.replace(/[\s-]/g, "");
        await ctx.db.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({
            where: { email: input.email },
          });
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email sudah terdaftar",
            });
          }
          const phoneTaken = await tx.user.findUnique({
            where: { phone },
            select: { id: true },
          });
          if (phoneTaken) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nomor HP sudah terdaftar",
            });
          }
          await tx.user.create({
            data: {
              email: input.email,
              firstName: input.first_name,
              lastName: input.last_name,
              phone,
              password: hash,
              maxAISession: 20,
              packageStart: new Date(),
              packageRnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              wallets: { create: { name: DEFAULT_WALLET_NAME } },
            },
          });
          await sendAndStoreCode({
            type: "register",
            identifier: input.email,
            to: input.email,
          });
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.user_id },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan",
        });
      }
      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email user tidak tersedia",
        });
      }
      await sendAndStoreCode({
        type: "change_password",
        identifier: input.user_id,
        to: user.email,
      });
    }),

  changePasswordVerify: publicProcedure
    .input(changePasswordVerifySchema)
    .mutation(async ({ input, ctx }) => {
      const saved = await getVerificationCode(
        verificationKey("change_password", input.user_id),
      );
      if (!saved || saved !== input.code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kode verifikasi tidak valid atau kedaluwarsa",
        });
      }
      await deleteVerificationCode(
        verificationKey("change_password", input.user_id),
      );
      const hash = await bcrypt.hash(input.new_password, 10);
      await ctx.db.user.update({
        where: { id: input.user_id },
        data: { password: hash },
      });
      return { success: true };
    }),

  resendRegisterCode: publicProcedure
    .input(resendRegisterCodeSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan",
        });
      }
      await sendAndStoreCode({
        type: "register",
        identifier: input.email,
        to: input.email,
      });
    }),

  forgotPassword: publicProcedure
    .input(resendRegisterCodeSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan",
        });
      }
      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email user tidak tersedia",
        });
      }
      await sendAndStoreCode({
        type: "change_password",
        identifier: user.id,
        to: user.email,
      });
    }),

  resendChangePasswordCode: protectedProcedure
    .input(resendChangePasswordCodeSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.user_id },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan",
        });
      }
      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email user tidak tersedia",
        });
      }
      await sendAndStoreCode({
        type: "change_password",
        identifier: input.user_id,
        to: user.email,
      });
    }),

  verifyCode: publicProcedure
    .input(verifyCodeSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const saved = await getVerificationCode(
          verificationKey(input.type, input.identifier),
        );
        if (!saved || saved !== input.code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Kode verifikasi tidak valid atau kedaluwarsa",
          });
        }
        await deleteVerificationCode(
          verificationKey(input.type, input.identifier),
        );

        if (input.type === "register") {
          await ctx.db.user.update({
            where: { email: input.identifier },
            data: { status: "GRATIS" },
          });
        }

        return { email: input.identifier };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),

  findAll: protectedProcedure
    .input(userFilterSchema)
    .query(async ({ input, ctx }) => {
      const where = {
        ...(input.name
          ? {
              OR: [
                { firstName: { contains: input.name } },
                { lastName: { contains: input.name } },
              ],
            }
          : {}),
        ...(input.role ? { role: input.role as Role } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
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
      const user = await ctx.db.user.findUnique({ where: { id: input.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.userId! },
      select: {
        phone: true,
        packageStart: true,
        packageRnd: true,
        aiSessionCount: true,
        maxAISession: true,
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  update: protectedProcedure
    .input(userUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.update({
        where: { id: input.user_id },
        data: { firstName: input.first_name, lastName: input.last_name },
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: userUpdateSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          firstName: input.data.first_name,
          lastName: input.data.last_name,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.delete({ where: { id: input.id } });
    }),

  deleteBatch: protectedProcedure
    .input(userDeleteSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.deleteMany({ where: { id: { in: input.ids } } });
    }),
});
