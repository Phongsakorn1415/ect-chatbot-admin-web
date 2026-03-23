import { db } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${process.env.CHATBOT_API_URL}/embeddings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    let count = 0;
    if (data.status === "success" && data.data) {
      count = (data.data.subject_id?.length || 0) + (data.data.teacher_id?.length || 0);
    }
    return NextResponse.json({ ...data, count });
  } catch (error) {
    console.error("Error fetching embeds:", error);
    return NextResponse.json(
      { error: "Failed to fetch embeds" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { subject_id, teacher_id } = body as {
      subject_id?: number[];
      teacher_id?: number[];
    };
    
    if ((!subject_id || subject_id.length === 0) && (!teacher_id || teacher_id.length === 0)) {
      const getRes = await fetch(`${process.env.CHATBOT_API_URL}/embeddings`);
      const missingData = await getRes.json();
      if (missingData.status === "success" && missingData.data) {
        subject_id = missingData.data.subject_id || [];
        teacher_id = missingData.data.teacher_id || [];
      }
    }
    
    const response = await fetch(`${process.env.CHATBOT_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id, teacher_id }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching embeds:", error);
    return NextResponse.json(
      { error: "Failed to fetch embeds" },
      { status: 500 },
    );
  }
}
