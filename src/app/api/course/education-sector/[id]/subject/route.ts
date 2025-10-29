import { db } from "@/lib/database";
import { NextResponse } from "next/server";

// GET /api/course/education-sector/[id]/subject
// Retrieve subjects for a specific education sector
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const subjects = await db.subject.findMany({
      where: { education_sectorId: Number(id) },
    });
    return NextResponse.json({ data: subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
