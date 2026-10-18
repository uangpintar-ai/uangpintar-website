import { env } from "@/env";
import { Resend } from "resend";
import { generateRegisterCodeEmail } from "@/const/email/register-code-email";
import { generateForgetPasswordCodeEmail } from "@/const/email/change-password-code-email";

const resend = new Resend(env.RESEND);

export type MailerType = {
  to: string[];
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: MailerType) => {
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    html,
  });
  if (error || !data?.id) {
    throw new Error(error?.message ?? "Gagal mengirim email");
  }
  return data;
};

export type VerificationCodeType = "register" | "change_password";

export const sendVerificationCode = async ({
  to,
  code,
  type,
  link,
}: {
  to: string;
  code: string;
  type: VerificationCodeType;
  link?: string;
}) => {
  const { subject, html } =
    type === "register"
      ? generateRegisterCodeEmail(code)
      : generateForgetPasswordCodeEmail(link ?? "");
  await sendEmail({ to: [to], subject, html });
};
