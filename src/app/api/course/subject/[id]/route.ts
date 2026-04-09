import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { requireAuth } from "@/lib/utils/auth";

type PrerequisiteInput = { requiresId: number; type: "PRE" | "CO" };

//PATCH /api/course/subject/[id]
// Update a specific subject
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
      name_embedding,
    } = body;
    const { id } = await params;
    const subjectId = Number(id);

    const data: any = {
      code,
      name,
      credit,
      language,
      isRequire,
    };

    if (education_sectorId !== undefined) {
      data.Education_sector_id = education_sectorId
        ? { connect: { id: education_sectorId } }
        : { disconnect: true };
    }

    if (course_yearId !== undefined) {
      data.Course_year_id = course_yearId
        ? { connect: { id: course_yearId } }
        : { disconnect: true };
    }

    // Validate and replace prerequisites if provided
    if (prerequisites !== undefined) {
      const prereqList: PrerequisiteInput[] = prerequisites ?? [];

      // Determine the target sector of the subject being updated
      let targetSectorId: number | null = null;
      if (education_sectorId !== undefined) {
        targetSectorId = education_sectorId ? Number(education_sectorId) : null;
      } else {
        const existing = await db.subject.findUnique({
          where: { id: subjectId },
          select: { education_sectorId: true },
        });
        targetSectorId = existing?.education_sectorId ?? null;
      }

      const getSectorOrder = (year: number | null, semester: number | null) =>
        (year ?? 0) * 100 + (semester === 0 ? 3 : (semester ?? 0));

      const currentSector = targetSectorId
        ? await db.education_sector.findUnique({
            where: { id: targetSectorId },
            select: { year: true, semester: true },
          })
        : null;
      const currentOrder = currentSector
        ? getSectorOrder(currentSector.year, currentSector.semester)
        : 999999;

      for (const prereq of prereqList) {
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
          if (reqSubject.education_sectorId !== targetSectorId) {
            return NextResponse.json(
              {
                error: `วิชาเรียนร่วมกัน (CO) ต้องอยู่ในภาคการศึกษาเดียวกัน`,
              },
              { status: 400 },
            );
          }
          // CO duplicate guard: check reverse relation excluding the current subject's own entry
          const reverseExists = await db.subjectRelation.findFirst({
            where: {
              subjectId: prereq.requiresId,
              requiresId: { not: subjectId },
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

      // Replace strategy: delete all existing dependencies then insert new ones
      await db.subjectRelation.deleteMany({ where: { subjectId } });

      if (prereqList.length > 0) {
        await db.subjectRelation.createMany({
          data: prereqList.map((p) => ({
            subjectId,
            requiresId: p.requiresId,
            type: p.type,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updatedSubject = await db.subject.update({
      where: { id: subjectId },
      data,
    });

    if (name_embedding === null) {
      await db.$executeRaw`UPDATE "subject" SET "name_embedding" = NULL WHERE "id" = ${subjectId}`;
    }
    return NextResponse.json({
      Message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 },
    );
  }
}

//DELETE /api/course/subject/[id]
// Delete a specific subject
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Valid subject ID is required" },
        { status: 400 },
      );
    }

    const existing = await db.subject.findUnique({ where: { id: idNum } });
    if (!existing) {
      return NextResponse.json(
        { message: "Subject not found" },
        { status: 404 },
      );
    }

    await db.teach.deleteMany({ where: { subjectId: idNum } });

    await db.subject.delete({
      where: { id: idNum },
    });
    return NextResponse.json({
      Message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 },
    );
  }
}
