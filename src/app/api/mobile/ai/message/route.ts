import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { fail, ok, str, verifyBearerToken } from "@/lib/mobile-auth";
import {
  SYSTEM_PROMPT,
  chatCompletion,
  draftSummary,
  getOrCreateOpenSession,
  parseAIResponse,
} from "@/server/services/ai-service";

type Draft = {
  type?: string | null;
  category?: string | null;
  purpose?: string | null;
  details?: { name?: string | null; amount?: string | number | null }[] | null;
  trxDate?: string | null;
  trxTime?: string | null;
};

export async function POST(req: NextRequest) {
  const claims = await verifyBearerToken(req);
  if (!claims?.userId) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const prompt = str(body?.prompt).trim();
  const draft: Draft | undefined = body?.draft ?? undefined;

  if (!prompt) return fail("Prompt tidak boleh kosong", 400);
  if (prompt.length > 200) return fail("Prompt maksimal 200 karakter", 400);

  const session = await getOrCreateOpenSession(db, claims.userId);

  const systemContent = draft
    ? `${SYSTEM_PROMPT}\n\nData transaksi sebelumnya (perbarui field yang disebut pengguna, lainnya biarkan):\n${draftSummary(draft)}`
    : SYSTEM_PROMPT;

  const { content, usage } = await chatCompletion(
    [
      { role: "system", content: systemContent },
      { role: "user", content: prompt },
    ],
    "xiaomi/mimo-v2.6-flash",
  );

  const parsed = parseAIResponse(content);
  if (parsed.type == null) parsed.type = parsed.category ?? null;

  await db.aIChatSessionDetail.create({
    data: {
      sessionId: session.id,
      prompt,
      response: parsed as unknown as Prisma.InputJsonValue,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      cost: usage?.cost ?? 0,
    },
  });

  return ok({ data: parsed, usage });
}
