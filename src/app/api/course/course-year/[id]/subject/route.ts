import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/course/course-year/:id/subject
// Get all subjects in a specific course year
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const courseYearId = Number(id);

  if (Number.isNaN(courseYearId)) {
    return NextResponse.json(
      { error: "Invalid course year id" },
      { status: 400 },
    );
  }

  const subjects = await db.subject.findMany({
    where: { course_yearId: courseYearId },
    include: { prerequisiteFor: true },
  });

  return NextResponse.json(subjects);
}
