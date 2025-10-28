import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");
    // Very simple mock: build subjects from file names
    const data = files
      .map((f) => (typeof f === "object" && "name" in f ? String((f as any).name) : null))
      .filter((n): n is string => !!n)
      .slice(0, 5)
      .map((name, idx) => ({
        code: `AI${(idx + 1).toString().padStart(2, "0")}`,
        name: name.replace(/\.[^.]+$/, ""),
        credit: 3,
        language: "ไทย",
      }));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("AI parse error", e);
    return NextResponse.json({ data: [] });
  }
}
