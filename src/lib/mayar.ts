import { z } from "zod";
import { env } from "@/env";
import { PLANS, type PlanId } from "@/const/payment";
import {
  parseMayarPaymentDetail,
  type MayarPaymentMethod,
} from "@/const/mayar-payment";
import { timingSafeEqual } from "crypto";

const createInvoiceResponse = z.object({
  statusCode: z.number(),
  messages: z.string().optional(),
  message: z.string().optional(),
  data: z.object({
    id: z.string(),
    transactionId: z.string(),
    link: z.string().url(),
    paymentDetail: z.unknown().optional(),
  }),
});

const invoiceDetailResponse = z.object({
  statusCode: z.number(),
  data: z.object({
    id: z.string(),
    amount: z.number(),
    status: z.string(),
  }),
});

const getApiKey = () => {
  if (!env.MAYAR_API_KEY) {
    throw new Error("MAYAR_API_KEY belum diatur");
  }
  return env.MAYAR_API_KEY;
};

const headers = () => ({
  Authorization: `Bearer ${getApiKey()}`,
  "Content-Type": "application/json",
});

export const createMayarInvoice = async (input: {
  plan: PlanId;
  amount: number;
  name: string;
  email: string;
  mobile: string;
  orderId: string;
  expiresAt?: Date;
  paymentMethod?: MayarPaymentMethod;
}) => {
  const plan = PLANS[input.plan];

  const response = await fetch(`${env.MAYAR_API_BASE}/invoices/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      description: plan.description,
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
      expiredAt: (
        input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
      ).toISOString(),
      items: [
        {
          quantity: 1,
          rate: input.amount,
          description: plan.description,
        },
      ],
      extraData: { orderId: input.orderId, plan: input.plan },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const json: unknown = await response.json().catch(() => null);
  const parsed = createInvoiceResponse.safeParse(json);

  if (!response.ok || !parsed.success) {
    const message =
      typeof json === "object" && json !== null
        ? ((json as { messages?: string; message?: string }).messages ??
          (json as { message?: string }).message)
        : undefined;

    throw new Error(message ?? "Gagal membuat invoice Mayar");
  }

  const data = parsed.data.data;

  return {
    ...data,
    paymentDetail: parseMayarPaymentDetail(data.paymentDetail),
  };
};

export const getMayarInvoice = async (invoiceId: string) => {
  const response = await fetch(
    `${env.MAYAR_API_BASE}/invoices/${encodeURIComponent(invoiceId)}`,
    {
      headers: headers(),
      signal: AbortSignal.timeout(15000),
    },
  );

  const json: unknown = await response.json().catch(() => null);
  const parsed = invoiceDetailResponse.safeParse(json);

  if (!response.ok || !parsed.success) return null;

  return parsed.data.data;
};

export const isValidMayarWebhookToken = (token: string | null) => {
  const expected = env.MAYAR_WEBHOOK_TOKEN;
  if (!expected || !token) return false;

  const received = Buffer.from(token);
  const secret = Buffer.from(expected);

  return received.length === secret.length && timingSafeEqual(received, secret);
};
