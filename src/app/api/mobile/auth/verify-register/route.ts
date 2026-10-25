import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { fail, ok, signMobileToken, str } from "@/lib/mobile-auth";
import {
  deleteVerificationCode,
  getVerificationCode,
  verificationKey,
} from "@/lib/redis";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = str(body?.email).trim().toLowerCase();
  const code = str(body?.code);

  if (!email || !code) {
    return fail("Email dan kode harus diisi", 400);
  }
  if (!/^\d{6}$/.test(code)) {
    return fail("Kode harus 6 digit", 400);
  }

  const saved = await getVerificationCode(verificationKey("register", email));
  if (!saved || saved !== code) {
    return fail("Kode verifikasi tidak valid atau kedaluwarsa", 400);
  }
  await deleteVerificationCode(verificationKey("register", email));

  const user = await db.user.update({
    where: { email },
    data: { status: "GRATIS" },
  });

  const token = await signMobileToken({
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  });

  return ok({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    },
  });
}
