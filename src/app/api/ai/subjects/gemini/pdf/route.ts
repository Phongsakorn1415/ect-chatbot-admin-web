import { NextRequest, NextResponse } from "next/server";
import { getDataFromPDF } from "@/lib/services/Gemini";

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data" },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Check if file exists
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // Process the PDF with Gemini
    const result = await getDataFromPDF(base64Data);

    // Return the response
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}