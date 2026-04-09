import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

//GET /api/course/subject
// Retrieve all subjects
export async function GET() {
  try {
    const subjects = await db.subject.findMany();
    return NextResponse.json({ data: subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 },
    );
  }
}

type PrerequisiteInput = { requiresId: number; type: "PRE" | "CO" };

//POST /api/course/subject
// Create a new subject
export async function POST(req: Request) {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      code,
      name,
      credit,
      language,
      isRequire,
      education_sectorId,
      course_yearId,
      prerequisites,
    } = body as {
      code?: string;
      name?: string;
      credit?: number;
      language?: string;
      isRequire?: boolean;
      education_sectorId?: number | string | null;
      course_yearId?: number | string | null;
      prerequisites?: PrerequisiteInput[];
    };

    // Basic validation
    if (typeof isRequire !== "boolean") {
      return NextResponse.json(
        { error: "Field 'isRequire' must be a boolean" },
        { status: 400 },
      );
    }

    // Elective subjects cannot have prerequisites
    if (isRequire === false && prerequisites && prerequisites.length > 0) {
      return NextResponse.json(
        { error: "วิชาเลือกไม่สามารถมีความต้องการก่อนเรียนได้" },
        { status: 400 },
      );
    }

    // Normalize IDs to numbers when provided
    const providedSectorId =
      education_sectorId !== undefined && education_sectorId !== null
        ? Number(education_sectorId)
        : null;
    const providedCourseYearId =
      course_yearId !== undefined && course_yearId !== null
        ? Number(course_yearId)
        : null;

    if (providedSectorId !== null && Number.isNaN(providedSectorId)) {
      return NextResponse.json(
        { error: "Field 'education_sectorId' must be a number" },
        { status: 400 },
      );
    }
    if (providedCourseYearId !== null && Number.isNaN(providedCourseYearId)) {
      return NextResponse.json(
        { error: "Field 'course_yearId' must be a number" },
        { status: 400 },
      );
    }

    let finalEducationSectorId: number | null = null;
    let finalCourseYearId: number | null = null;

    if (isRequire === true) {
      if (providedCourseYearId !== null) {
        return NextResponse.json(
          {
            error:
              "Cannot set 'course_yearId' when 'isRequire' is true. It will be derived from the linked education sector.",
          },
          { status: 400 },
        );
      }
      if (providedSectorId === null) {
        return NextResponse.json(
          {
            error: "'education_sectorId' is required when 'isRequire' is true",
          },
          { status: 400 },
        );
      }

      const sector = await db.education_sector.findUnique({
        where: { id: providedSectorId },
        select: { course_yearId: true },
      });
      if (!sector) {
        return NextResponse.json(
          { error: "Invalid 'education_sectorId': not found" },
          { status: 400 },
        );
      }
      if (sector.course_yearId === null) {
        return NextResponse.json(
          {
            error:
              "The specified education sector is not linked to any course year",
          },
          { status: 400 },
        );
      }

      finalEducationSectorId = providedSectorId;
      finalCourseYearId = sector.course_yearId;
    } else {
      if (providedSectorId !== null) {
        return NextResponse.json(
          {
            error: "Cannot set 'education_sectorId' when 'isRequire' is false",
          },
          { status: 400 },
        );
      }
      if (providedCourseYearId === null) {
        return NextResponse.json(
          { error: "'course_yearId' is required when 'isRequire' is false" },
          { status: 400 },
        );
      }
      finalEducationSectorId = null;
      finalCourseYearId = providedCourseYearId;
    }

    // Validate prerequisites if any
    if (prerequisites && prerequisites.length > 0) {
      const currentSectorId = finalEducationSectorId;

      // Fetch current sector order info
      const currentSector = currentSectorId
        ? await db.education_sector.findUnique({
            where: { id: currentSectorId },
            select: { year: true, semester: true },
          })
        : null;

      const getSectorOrder = (year: number | null, semester: number | null) =>
        (year ?? 0) * 100 + (semester === 0 ? 3 : (semester ?? 0));

      const currentOrder = currentSector
        ? getSectorOrder(currentSector.year, currentSector.semester)
        : 999999;

      for (const prereq of prerequisites) {
        const reqSubject = await db.subject.findUnique({
          where: { id: prereq.requiresId },
          include: {
            Education_sector_id: { select: { year: true, semester: true } },
          },
        });
        if (!reqSubject) {
          return NextResponse.json(
            { error: `ไม่พบวิชาที่ใช้อ้างอิง id=${prereq.requiresId}` },
            { status: 400 },
          );
        }

        if (prereq.type === "PRE") {
          const reqOrder = reqSubject.Education_sector_id
            ? getSectorOrder(
                reqSubject.Education_sector_id.year,
                reqSubject.Education_sector_id.semester,
              )
            : 999999;
          if (reqOrder >= currentOrder) {
            return NextResponse.json(
              {
                error: `วิชาที่ต้องเรียนก่อน (PRE) ต้องอยู่ในภาคการศึกษาก่อนหน้า`,
              },
              { status: 400 },
            );
          }
        } else if (prereq.type === "CO") {
          if (
            reqSubject.education_sectorId !== finalEducationSectorId
          ) {
            return NextResponse.json(
              {
                error: `วิชาเรียนร่วมกัน (CO) ต้องอยู่ในภาคการศึกษาเดียวกัน`,
              },
              { status: 400 },
            );
          }
          // CO duplicate guard: check reverse relation
          const reverseExists = await db.subjectRelation.findFirst({
            where: {
              subjectId: prereq.requiresId,
              type: "CO",
            },
          });
          if (reverseExists) {
            return NextResponse.json(
              {
                error: `ความสัมพันธ์ CO ระหว่างวิชานี้กับวิชา id=${prereq.requiresId} มีอยู่แล้ว`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    const newSubject = await db.subject.create({
      data: {
        code,
        name,
        credit,
        language,
        isRequire,
        education_sectorId: finalEducationSectorId,
        course_yearId: finalCourseYearId,
      },
    });

    // Create SubjectRelation records
    if (prerequisites && prerequisites.length > 0) {
      await db.subjectRelation.createMany({
        data: prerequisites.map((p) => ({
          subjectId: newSubject.id,
          requiresId: p.requiresId,
          type: p.type,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(
      {
        Message: "Subject created successfully",
        data: newSubject,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 },
    );
  }
}
