import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "@/server/api/routers/user-router";
import { transactionRouter } from "@/server/api/routers/transaction-router";
import { customerMessageRouter } from "@/server/api/routers/customer-message-router";
import { adminRouter } from "@/server/api/routers/admin-router";
import { aiRouter } from "@/server/api/routers/ai-router";
import { walletRouter } from "@/server/api/routers/wallet-router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  transaction: transactionRouter,
  wallet: walletRouter,
  customerMessage: customerMessageRouter,
  admin: adminRouter,
  ai: aiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
