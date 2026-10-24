import { randomInt } from "crypto";
import { sendEmail } from "@/lib/mailer";
import { saveVerificationCode, verificationKey } from "@/lib/redis";
import { generatePasswordSetupEmail } from "@/const/email/setup-password-email";

const SETUP_PASSWORD_TTL_SECONDS = 24 * 60 * 60;

const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const sendPasswordSetupEmail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  const code = randomInt(100000, 999999).toString();

  await saveVerificationCode(
    verificationKey("change_password", userId),
    code,
    SETUP_PASSWORD_TTL_SECONDS,
  );

  const link = `${getBaseUrl()}/update-password?code=${code}&user_id=${encodeURIComponent(
    userId,
  )}`;

  const { subject, html } = generatePasswordSetupEmail(link);
  await sendEmail({ to: [email], subject, html });
};
