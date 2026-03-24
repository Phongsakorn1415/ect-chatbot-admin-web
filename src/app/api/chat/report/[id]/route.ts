import { NextResponse } from "next/server";
import { db } from "@/lib/database"; // Assuming Prisma is established in src/lib/database

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reportMessage } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing log ID" },
        { status: 400 }
      );
    }

    const logId = parseInt(id, 10);
    if (isNaN(logId)) {
      return NextResponse.json(
        { error: "Invalid log ID" },
        { status: 400 }
      );
    }

    if (!reportMessage) {
      return NextResponse.json(
        { error: "Report message is required" },
        { status: 400 }
      );
    }

    // Update the ChatLog using Prisma
    const updatedLog = await db.chatLog.update({
      where: { id: logId },
      data: {
        isReported: true,
        reportMessage: reportMessage,
        reportedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    console.error("Error updating chat log report:", error);
    return NextResponse.json(
      { error: "Failed to report chat log" },
      { status: 500 }
    );
  }
}
