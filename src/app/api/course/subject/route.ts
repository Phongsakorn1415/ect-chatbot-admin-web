import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/course/subject
// Retrieve all subjects
export async function GET() {
  try {
    const subjects = await db.subject.findMany();
    return NextResponse.json({ data: subjects });
  }catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

//POST /api/course/subject
// Create a new subject
export async function POST(req: Request) {
    try {
        const body = await req.json();
    const { name, credit, language, isRequire, education_sectorId, course_yearId } = body as {
      name?: string;
      credit?: number;
      language?: string;
      isRequire?: boolean;
      education_sectorId?: number | string | null;
      course_yearId?: number | string | null;
    };

    // Basic validation
    if (typeof isRequire !== "boolean") {
      return NextResponse.json({ error: "Field 'isRequire' must be a boolean" }, { status: 400 });
    }

    // Normalize IDs to numbers when provided
    const providedSectorId = education_sectorId !== undefined && education_sectorId !== null
      ? Number(education_sectorId)
      : null;
    const providedCourseYearId = course_yearId !== undefined && course_yearId !== null
      ? Number(course_yearId)
      : null;

    if (providedSectorId !== null && Number.isNaN(providedSectorId)) {
      return NextResponse.json({ error: "Field 'education_sectorId' must be a number" }, { status: 400 });
    }
    if (providedCourseYearId !== null && Number.isNaN(providedCourseYearId)) {
      return NextResponse.json({ error: "Field 'course_yearId' must be a number" }, { status: 400 });
    }

    let finalEducationSectorId: number | null = null;
    let finalCourseYearId: number | null = null;

    if (isRequire === true) {
      // Rule: when required, client cannot set course_yearId manually; it must be derived
      if (providedCourseYearId !== null) {
        return NextResponse.json({ error: "Cannot set 'course_yearId' when 'isRequire' is true. It will be derived from the linked education sector." }, { status: 400 });
      }
      if (providedSectorId === null) {
        return NextResponse.json({ error: "'education_sectorId' is required when 'isRequire' is true" }, { status: 400 });
      }

      // Fetch the sector to derive its course_yearId
      const sector = await db.education_sector.findUnique({
        where: { id: providedSectorId },
        select: { course_yearId: true },
      });
      if (!sector) {
        return NextResponse.json({ error: "Invalid 'education_sectorId': not found" }, { status: 400 });
      }
      if (sector.course_yearId === null) {
        return NextResponse.json({ error: "The specified education sector is not linked to any course year" }, { status: 400 });
      }

      finalEducationSectorId = providedSectorId;
      finalCourseYearId = sector.course_yearId;
    } else {
      // isRequire === false
      // Rule: when not required, cannot set education_sectorId; must set course_yearId directly
      if (providedSectorId !== null) {
        return NextResponse.json({ error: "Cannot set 'education_sectorId' when 'isRequire' is false" }, { status: 400 });
      }
      if (providedCourseYearId === null) {
        return NextResponse.json({ error: "'course_yearId' is required when 'isRequire' is false" }, { status: 400 });
      }
      finalEducationSectorId = null;
      finalCourseYearId = providedCourseYearId;
    }

    const newSubject = await db.subject.create({
      data: {
        name,
        credit,
        language,
        isRequire,
        education_sectorId: finalEducationSectorId,
        course_yearId: finalCourseYearId,
      },
    });
        return NextResponse.json({
            Message: "Subject created successfully",
            data: newSubject
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
    }
}