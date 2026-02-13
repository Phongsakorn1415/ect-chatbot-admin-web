import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import SendMail from "@/lib/services/NodeMailer";

//GET /api/invite
// get all invites
export async function GET() {
  try {
    // Expire PENDING invites older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db.invite.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      data: { status: "EXPIRED" as const },
    });

    const invites = await db.invite.findMany({
      select: {
        id: true,
        email: true,
        title: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        invitedBy: {
          select: {
            title: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to UI-friendly shape and stringify id/date
    const mapped = invites.map((inv) => ({
      id: inv.id.toString(),
      title: inv.title ?? "",
      firstName: inv.firstName ?? "",
      lastName: inv.lastName ?? "",
      email: inv.email,
      role: inv.role,
      status: inv.status,
      invitedBy:
        [
          inv.invitedBy?.title,
          inv.invitedBy?.firstName,
          inv.invitedBy?.lastName,
        ]
          .filter(Boolean)
          .join(" ") || "-",
      createdAt: inv.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { message: "Failed to fetch invites" },
      { status: 500 },
    );
  }
}

// DELETE /api/invite
// delete multiple invites by ids
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 },
      );
    }

    const numericIds = ids
      .map((id) => Number(id))
      .filter((n) => !Number.isNaN(n));
    if (numericIds.length === 0) {
      return NextResponse.json(
        { message: "No valid ids provided" },
        { status: 400 },
      );
    }

    const deleted = await db.invite.deleteMany({
      where: { id: { in: numericIds } },
    });
    return NextResponse.json(
      {
        message: `Successfully deleted ${deleted.count} invite(s)`,
        deletedCount: deleted.count,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete invites error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PUT /api/invite
// resend invitation emails for selected invites
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 },
      );
    }

    const numericIds = ids
      .map((id) => Number(id))
      .filter((n) => !Number.isNaN(n));
    if (numericIds.length === 0) {
      return NextResponse.json(
        { message: "No valid ids provided" },
        { status: 400 },
      );
    }

    const invites = await db.invite.findMany({
      where: { id: { in: numericIds } },
      select: {
        id: true,
        email: true,
        title: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        token: true,
      },
    });

    let resent = 0;
    let regenerated = 0; // count of EXPIRED -> PENDING with new token
    let skipped = 0; // ACCEPTED

    for (const inv of invites) {
      // If ACCEPTED -> skip resend
      if (inv.status === "ACCEPTED") {
        skipped += 1;
        continue;
      }

      // Determine token and update if EXPIRED
      let token = inv.token;
      if (inv.status === "EXPIRED") {
        token =
          Math.random().toString(36).substring(2) +
          Math.random().toString(36).substring(2);
        await db.invite.update({
          where: { id: inv.id },
          data: {
            token,
            status: "PENDING",
            createdAt: new Date(),
          },
        });
        regenerated += 1;
      }

      const link = `${process.env.INVITE_ACCEPT_URL}?token=${token}`;
      try {
        const fullName = [inv.title, inv.firstName, inv.lastName]
          .filter(Boolean)
          .join(" ");
        const role = inv.role;
        const subject =
          "คุณได้รับเชิญให้เข้าร่วมใช้งานเว็บจัดการข้อมูล ECT Chatbot";
        const text =
          `สวัสดี ${fullName || ""},\n\n` +
          `${role && role !== "TEACHER" ? `คุณได้รับเชิญให้เข้าร่วมเป็น ${role} บนเว็บจัดการข้อมูล ECT Chatbot.` : "คุณได้รับเชิญเพื่อใช้งานเว็บจัดการข้อมูล ECT Chatbot."}\n\n` +
          `กรุณาเสร็จสิ้นการลงทะเบียนภายใน 7 วันโดยคลิกที่ลิงก์ด้านล่าง:\n${link}\n\n` +
          `หากคุณไม่ได้คาดหวังอีเมลนี้ คุณสามารถเพิกเฉยได้อย่างปลอดภัย`;

        const preheader =
          "เชิญเข้าร่วมใช้งานเว็บจัดการข้อมูล ECT Chatbot — ลิงก์จะหมดอายุใน 7 วัน";
        const roleLine =
          role && role !== "TEACHER"
            ? `คุณได้รับเชิญให้เข้าร่วมเป็น <strong>${role}</strong> บนเว็บจัดการข้อมูล ECT Chatbot.`
            : "คุณได้รับเชิญเพื่อใช้งานเว็บจัดการข้อมูล ECT Chatbot.";

        const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background-color:#f5f5f5;font-family:Roboto, 'Segoe UI', Arial, Helvetica, sans-serif;color:#1f2937;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;visibility:hidden;">${preheader}</span>
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
                <p style="margin:0 0 12px 0;font-size:16px;">สวัสดี ${fullName || "ผู้ใช้งาน"},</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">${roleLine}</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">กรุณาเสร็จสิ้นการลงทะเบียนภายใน 7 วันโดยคลิกปุ่มด้านล่าง:</p>

                <div style="text-align:center;margin:24px 0;">
                  <a href="${link}" target="_blank" style="display:inline-block;background-color:#1976d2;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;">
                    ยืนยันการเชิญ
                  </a>
                </div>

                <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;">หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปยังเบราว์เซอร์ของคุณ</p>
                <p style="margin:0 0 16px 0;font-size:12px;word-break:break-all;color:#1d4ed8;">
                  <a href="${link}" target="_blank" style="color:#1d4ed8;text-decoration:underline;">${link}</a>
                </p>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <p style="margin:0;font-size:12px;color:#6b7280;">หากคุณไม่ได้คาดหวังอีเมลนี้ คุณสามารถเพิกเฉยได้อย่างปลอดภัย</p>
              </td>
            </tr>
          </table>
          <div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:12px;">&copy; ${new Date().getFullYear()} ECT Chatbot</div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

        // Fire-and-forget
        SendMail({ to: inv.email, subject, text, html });
        resent += 1;
      } catch (mailErr) {
        console.log("Failed to queue resend invitation email:", mailErr);
      }
    }

    return NextResponse.json(
      { message: "Resend processed", resent, regenerated, skipped },
      { status: 200 },
    );
  } catch (error) {
    console.error("Resend invites error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/invite
// create a new invite
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, title, firstName, lastName, role, inviterID } = body;

    // Basic validation: email and inviterID are required; others optional
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }
    const invitedById = Number(inviterID);
    if (!invitedById || Number.isNaN(invitedById)) {
      return NextResponse.json(
        { message: "inviterID is required" },
        { status: 400 },
      );
    }

    //check if user email already exists
    const existingUserEmail = await db.user.findUnique({
      where: {
        email: email,
      },
    });
    if (existingUserEmail) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Check for existing invites and update status if expired
    const existingInvites = await db.invite.findMany({
      where: {
        email: email,
        status: "PENDING",
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
    });

    // Update expired invites
    if (existingInvites.length > 0) {
      await db.invite.updateMany({
        where: {
          id: {
            in: existingInvites.map((invite) => invite.id),
          },
        },
        data: {
          status: "EXPIRED" as const,
        },
      });
    }

    // After expiring old ones, check for any still-active invite
    const existingInvite = await db.invite.findFirst({
      where: {
        email: email,
        status: {
          not: "EXPIRED",
        },
      },
    });
    if (existingInvite) {
      return NextResponse.json(
        { message: "Active invitation already exists for this email" },
        { status: 409 },
      );
    }

    // Create new invite
    const token =
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2); // Generate a simple token
    const link = `${process.env.INVITE_ACCEPT_URL}?token=${token}`; // Replace with your actual domain
    const allowedRoles = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;
    const inviteData: Record<string, unknown> = {
      email: email,
      status: "PENDING",
      token: token,
      invitedById: invitedById,
    };
    if (title) inviteData.title = title;
    if (firstName) inviteData.firstName = firstName;
    if (lastName) inviteData.lastName = lastName;
    if (role) {
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { message: "Invalid role provided" },
          { status: 400 },
        );
      }
      inviteData.role = role;
    }

    await db.invite.create({ data: inviteData as any });

    // Send invitation email (best-effort)
    try {
      const fromAddress = (process.env.EMAIL_FROM ||
        process.env.EMAIL_USER ||
        "no-reply@example.com") as string;
      const fullName = [title, firstName, lastName].filter(Boolean).join(" ");
      const subject =
        "คุณได้รับเชิญให้เข้าร่วมใช้งานเว็บจัดการข้อมูล ECT Chatbot";

      // Plain-text fallback
      const text =
        `สวัสดี ${fullName || ""},\n\n` +
        `${
          role && role !== "TEACHER"
            ? `คุณได้รับเชิญให้เข้าร่วมเป็น ${role} บนเว็บจัดการข้อมูล ECT Chatbot.`
            : "คุณได้รับเชิญเพื่อใช้งานเว็บจัดการข้อมูล ECT Chatbot."
        }\n\n` +
        `กรุณาเสร็จสิ้นการลงทะเบียนภายใน 7 วันโดยคลิกที่ลิงก์ด้านล่าง:\n${link}\n\n` +
        `หากคุณไม่ได้คาดหวังอีเมลนี้ คุณสามารถเพิกเฉยได้อย่างปลอดภัย`;

      const preheader =
        "เชิญเข้าร่วมใช้งานเว็บจัดการข้อมูล ECT Chatbot — ลิงก์จะหมดอายุใน 7 วัน";
      const roleLine =
        role && role !== "TEACHER"
          ? `คุณได้รับเชิญให้เข้าร่วมเป็น <strong>${role}</strong> บนเว็บจัดการข้อมูล ECT Chatbot.`
          : "คุณได้รับเชิญเพื่อใช้งานเว็บจัดการข้อมูล ECT Chatbot.";

      // MUI-like styled HTML (inline CSS for email clients) with a button CTA
      const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background-color:#f5f5f5;font-family:Roboto, 'Segoe UI', Arial, Helvetica, sans-serif;color:#1f2937;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;visibility:hidden;">${preheader}</span>
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
                <p style="margin:0 0 12px 0;font-size:16px;">สวัสดี ${
                  fullName || "ผู้ใช้งาน"
                },</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">${roleLine}</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">กรุณาเสร็จสิ้นการลงทะเบียนภายใน 7 วันโดยคลิกปุ่มด้านล่าง:</p>

                <div style="text-align:center;margin:24px 0;">
                  <a href="${link}" target="_blank" style="display:inline-block;background-color:#1976d2;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;">
                    ยืนยันการเชิญ
                  </a>
                </div>

                <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;">หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปยังเบราว์เซอร์ของคุณ</p>
                <p style="margin:0 0 16px 0;font-size:12px;word-break:break-all;color:#1d4ed8;">
                  <a href="${link}" target="_blank" style="color:#1d4ed8;text-decoration:underline;">${link}</a>
                </p>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
                <p style="margin:0;font-size:12px;color:#6b7280;">หากคุณไม่ได้คาดหวังอีเมลนี้ คุณสามารถเพิกเฉยได้อย่างปลอดภัย</p>
              </td>
            </tr>
          </table>
          <div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:12px;">&copy; ${new Date().getFullYear()} ECT Chatbot</div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

      // Fire-and-forget; any error will be logged inside SendMail
      SendMail({
        from: fromAddress,
        to: email,
        subject,
        text,
        html,
      });
    } catch (mailErr) {
      console.log("Failed to queue invitation email:", mailErr);
    }

    return NextResponse.json(
      { message: "invite successful", data: body },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error during create invitetation" },
      { status: 500 },
    );
  }
}
