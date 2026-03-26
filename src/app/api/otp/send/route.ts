import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import SendMail from "@/lib/services/NodeMailer";

const OTP_EXPIRY_MINUTES = 10;
const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { purpose, email, currentPassword } = body as {
      purpose: "CHANGE_PASSWORD" | "RESET_PASSWORD";
      email?: string;
      currentPassword?: string;
    };

    if (!purpose || !["CHANGE_PASSWORD", "RESET_PASSWORD"].includes(purpose)) {
      return NextResponse.json({ message: "purpose ไม่ถูกต้อง" }, { status: 400 });
    }

    let userId: number;
    let targetEmail: string;

    if (purpose === "CHANGE_PASSWORD") {
      // ต้องมี session
      const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
      if (!token?.id) {
        return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
      }
      userId = Number(token.id);

      if (!currentPassword) {
        return NextResponse.json({ message: "กรุณากรอกรหัสผ่านปัจจุบัน" }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || !user.passwordHash) {
        return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 401 });
      }

      targetEmail = user.email;
    } else {
      // RESET_PASSWORD — ไม่ต้อง session แต่ต้องมี email
      if (!email || typeof email !== "string") {
        return NextResponse.json({ message: "กรุณากรอกอีเมล" }, { status: 400 });
      }

      // Security: ไม่บอกว่า email มีอยู่หรือไม่ — ตอบเหมือนกันทุกกรณี
      const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) {
        // Response เหมือนกันเพื่อป้องกัน email enumeration
        return NextResponse.json({ message: "ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว หากไม่ได้รับ ให้ตรวจสอบในกล่อง Spam" }, { status: 200 });
      }
      userId = user.id;
      targetEmail = user.email;
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // ลบ OTP เก่าที่ยังไม่ได้ใช้ของ user+purpose นี้
    await db.otpVerification.deleteMany({
      where: { userId, purpose, usedAt: null },
    });

    // สร้าง OTP record ใหม่
    await db.otpVerification.create({
      data: { userId, otpHash, purpose, expiresAt },
    });

    // ส่ง OTP email
    const purposeLabel = purpose === "CHANGE_PASSWORD" ? "เปลี่ยนรหัสผ่าน" : "รีเซ็ตรหัสผ่าน";
    const subject = `รหัส OTP สำหรับ${purposeLabel} — ECT Chatbot`;
    const text = `รหัส OTP ของคุณสำหรับ${purposeLabel} คือ: ${otp}\n\nรหัสนี้จะหมดอายุใน ${OTP_EXPIRY_MINUTES} นาที\n\nหากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลนี้`;

    const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background-color:#f5f5f5;font-family:Roboto,'Segoe UI',Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
            <tr>
              <td style="background:#1976d2;height:56px;padding:0 24px;color:#ffffff;">
                <h1 style="margin:0;font-size:18px;line-height:56px;font-weight:600;">ECT Chatbot Admin</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;font-size:16px;">รหัส OTP สำหรับ<strong>${purposeLabel}</strong></p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#6b7280;">
                  กรุณาใช้รหัสด้านล่างนี้เพื่อดำเนินการต่อ รหัสจะหมดอายุใน <strong>${OTP_EXPIRY_MINUTES} นาที</strong>
                </p>
                <div style="text-align:center;margin:24px 0;background:#f0f4ff;border-radius:8px;padding:24px;">
                  <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1976d2;">${otp}</span>
                </div>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <p style="margin:0;font-size:12px;color:#6b7280;">หากคุณไม่ได้ทำรายการนี้ คุณสามารถเพิกเฉยได้อย่างปลอดภัย</p>
              </td>
            </tr>
          </table>
          <div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:12px;">&copy; ${new Date().getFullYear()} ECT Chatbot</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await SendMail({ to: targetEmail, subject, text, html });

    return NextResponse.json({ message: "ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว หากไม่ได้รับ ให้ตรวจสอบในกล่อง Spam" }, { status: 200 });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
