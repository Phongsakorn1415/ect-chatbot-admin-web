import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// DELETE /api/course/education-sector/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Invalid or missing education sector id" },
        { status: 400 }
      );
    }

    // Gather subject IDs under this course sector (needed to remove teaching records first)
    const subjectIds = await db.subject.findMany({
        where: { education_sectorId: idNum },
        select: { id: true }
    }).then(subjects => subjects.map(s => s.id));

    // Remove dependent teaching records first
    if (subjectIds.length > 0) {
        await db.teach.deleteMany({
            where: {
                subjectId: { in: subjectIds }
            }
        });
    }

    // Remove dependent Subject records
    await db.subject.deleteMany({ where: { education_sectorId: idNum } });

    //remove the education sector
    const deletedSector = await db.education_sector.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ data: deletedSector }, { status: 200 });
  } catch (error) {
    console.error("Error deleting education sector:", error);
    return NextResponse.error();
  }
}
