import { NextResponse } from "next/server";
import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import { db } from "@/server/db";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasMailServer = async (domain: string) => {
  try {
    if ((await resolveMx(domain)).length > 0) return true;
  } catch {
    // no MX record
  }

  try {
    if ((await resolve4(domain)).length > 0) return true;
  } catch {
    // no A record
  }

  try {
    if ((await resolve6(domain)).length > 0) return true;
  } catch {
    // no AAAA record
  }

  return false;
};

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({
      emailValid: false,
      registered: false,
      message: "Email tidak valid",
    });
  }

  const domain = email.slice(email.lastIndexOf("@") + 1);
  const emailValid = await hasMailServer(domain);

  if (!emailValid) {
    return NextResponse.json({
      emailValid: false,
      registered: false,
      message: "Domain email tidak dapat menerima pesan",
    });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { password: true },
  });

  if (user?.password) {
    return NextResponse.json({
      emailValid: true,
      registered: true,
      message: "Email sudah terdaftar. Silakan masuk terlebih dahulu.",
    });
  }

  return NextResponse.json({ emailValid: true, registered: false });
};
