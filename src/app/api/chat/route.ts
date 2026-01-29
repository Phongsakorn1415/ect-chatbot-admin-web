import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, chat_history } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Default to empty history if not provided
    const history = chat_history || [];

    // Call external Python AI Service
    // TODO: Move base URL to environment variable in production
    const response = await fetch(`${process.env.CHATBOT_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        chat_history: history,
        history_limit: 5, // You can adjust this default or pass it from frontend
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Service returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat proxy:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${process.env.CHATBOT_API_URL}/`);
    if (!response.ok) {
      throw new Error(`AI Service returned ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat health check:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 500 }
    );
  }
}
