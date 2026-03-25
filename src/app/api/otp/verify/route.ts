import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import bcrypt from "bcrypt";
import { getToken } from "next-auth/jwt";

const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { otp, newPassword, purpose, email } = body as {
      otp: string;
      newPassword: string;
      purpose: "CHANGE_PASSWORD" | "RESET_PASSWORD";
      email?: string;
    };

    // --- Validate inputs ---
    if (!otp || !newPassword || !purpose) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }
    if (!["CHANGE_PASSWORD", "RESET_PASSWORD"].includes(purpose)) {
      return NextResponse.json({ message: "purpose ไม่ถูกต้อง" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    // --- Find userId ---
    let userId: number;

    if (purpose === "CHANGE_PASSWORD") {
      const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
      if (!token?.id) {
        return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
      }
      userId = Number(token.id);
    } else {
      // RESET_PASSWORD
      if (!email || typeof email !== "string") {
        return NextResponse.json({ message: "กรุณาระบุอีเมล" }, { status: 400 });
      }
      const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) {
        return NextResponse.json({ message: "OTP ไม่ถูกต้องหรือหมดอายุแล้ว" }, { status: 400 });
      }
      userId = user.id;
    }

    // --- Find latest unused OTP ---
    const otpRecord = await db.otpVerification.findFirst({
      where: { userId, purpose, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ message: "ไม่พบ OTP กรุณาขอรหัสใหม่" }, { status: 400 });
    }

    // --- Check expiry ---
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ message: "OTP หมดอายุแล้ว กรุณาขอรหัสใหม่" }, { status: 400 });
    }

    // --- Verify OTP ---
    const otpMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!otpMatch) {
      return NextResponse.json({ message: "OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    // --- Update password ---
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // --- Mark OTP as used ---
    await db.otpVerification.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
