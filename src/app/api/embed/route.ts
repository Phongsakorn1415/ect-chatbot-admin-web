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
    return NextResponse.json(data);
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
    const { subject_id, teacher_id } = body as {
      subject_id?: number[];
      teacher_id?: number[];
    };
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
