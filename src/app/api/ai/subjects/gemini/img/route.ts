import { getDataFromImage } from "@/lib/services/Gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    if (!mimeType || !mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
    }

    const imageData = buffer.toString("base64");
    const geminiResponse = await getDataFromImage(imageData, mimeType);

    return NextResponse.json(geminiResponse);
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Failed to process image." }, { status: 500 });
  }
}