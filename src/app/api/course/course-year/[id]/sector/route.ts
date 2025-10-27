import { db } from "@/lib/database";
import { NextResponse } from "next/server";

// GET /api/course/course-year/[id]/sector
// Return all sectors by course year id (path param)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Invalid or missing course year id" },
        { status: 400 }
      );
    }

    const courseSector = await db.education_sector.findMany({
      where: { course_yearId: idNum }
    });

    // Sort by year asc; within same year: positive semesters asc first, then 0, then null last
    courseSector.sort((a, b) => {
      const yearA = a.year ?? Number.MAX_SAFE_INTEGER;
      const yearB = b.year ?? Number.MAX_SAFE_INTEGER;
      if (yearA !== yearB) return yearA - yearB;

      const semA = a.semester;
      const semB = b.semester;

      // Category: 0 = positive numbers, 1 = zero, 2 = null/undefined
      const catA = semA == null ? 2 : (semA === 0 ? 1 : 0);
      const catB = semB == null ? 2 : (semB === 0 ? 1 : 0);
      if (catA !== catB) return catA - catB;

      if (catA === 0 && catB === 0) {
        return semA! - semB!;
      }
      return 0; // both are zero or both are null -> keep relative order
    });

    if (!courseSector) {
      return NextResponse.json(
        { message: "Course sector not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: courseSector }, { status: 200 });
  } catch (error) {
    console.error("Error fetching course sector:", error);
    return NextResponse.error();
  }
}

// POST /api/course/course-year/[id]/sector
// create a new sector for a given course year id (path param)
export async function POST(
  request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Invalid or missing course year id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { year, semester } = body ?? {};

    // Allow semester = 0, but reject null/undefined; same for year
    if (year == null || semester == null) {
      return NextResponse.json(
        { message: "Missing year or semester" },
        { status: 400 }
      );
    }

    const yearNum = Number(year);
    const semesterNum = Number(semester);
    if (Number.isNaN(yearNum) || Number.isNaN(semesterNum)) {
      return NextResponse.json(
        { message: "Year and semester must be numbers" },
        { status: 400 }
      );
    }

    const newSector = await db.education_sector.create({
      data: {
        year: yearNum,
        semester: semesterNum,
        course_yearId: idNum,
      },
    });

    return NextResponse.json({ data: newSector }, { status: 201 });
  } catch (error) {
    console.error("Error creating course sector:", error);
    return NextResponse.error();
  }
}

// DELETE /api/course/course-year/[id]/sector
