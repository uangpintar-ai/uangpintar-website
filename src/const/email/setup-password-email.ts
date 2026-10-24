import type { TMailTemplate } from "@/server/api/types/global-type";

export const generatePasswordSetupEmail = (link: string): TMailTemplate => ({
  subject: "Atur Kata Sandi Akun Uang Pintar",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="margin-top: 0;">Atur Kata Sandi</h2>
      <p>Pembayaranmu sudah berhasil. Atur kata sandi akun Uang Pintar AI kamu dengan mengklik tombol di bawah:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #047857; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Atur Kata Sandi</a>
      </p>
      <p>Link berlaku selama 24 jam. Jika kamu tidak merasa melakukan pembayaran ini, abaikan email ini atau hubungi kami.</p>
    </div>
  `,
});
