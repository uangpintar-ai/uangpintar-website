import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { fail, ok, str } from "@/lib/mobile-auth";
import { sendRegisterCode } from "@/server/services/verification-service";
import { DEFAULT_WALLET_NAME } from "@/server/services/wallet-service";
import { DEFAULT_CATEGORIES } from "@/server/services/category-service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = str(body?.email).trim().toLowerCase();
  const firstName = str(body?.first_name).trim();
  const lastName = str(body?.last_name).trim();
  const phone = str(body?.phone).replace(/[\s-]/g, "");
  const password = str(body?.password);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Email tidak valid", 400);
  }
  if (firstName.length < 1 || firstName.length > 30) {
    return fail("Nama depan harus 1-30 karakter", 400);
  }
  if (lastName.length < 1 || lastName.length > 30) {
    return fail("Nama belakang harus 1-30 karakter", 400);
  }
  if (!/^\+?\d{10,15}$/.test(phone)) {
    return fail("Nomor HP tidak valid", 400);
  }
  if (password.length < 8 || password.length > 100) {
    return fail("Password minimal 8 karakter", 400);
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true },
  });
  if (existing) {
    return fail(
      existing.email === email
        ? "Email sudah terdaftar"
        : "Nomor HP sudah terdaftar",
      409,
    );
  }

  const hash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone,
      password: hash,
      maxAISession: 20,
      packageStart: new Date(),
      packageRnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      wallets: { create: { name: DEFAULT_WALLET_NAME } },
      transactionCategories: {
        create: DEFAULT_CATEGORIES.map((category) => ({
          name: category.name,
          icon: category.icon,
          sortOrder: category.sortOrder,
        })),
      },
    },
  });

  await sendRegisterCode(email);

  return ok({ message: "Kode verifikasi telah dikirim ke email Anda" }, 201);
}
