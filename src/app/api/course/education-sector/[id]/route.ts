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

    const deletedSector = await db.education_sector.delete({
      where: { id: idNum },
    });

    return NextResponse.json({ data: deletedSector }, { status: 200 });
  } catch (error) {
    console.error("Error deleting education sector:", error);
    return NextResponse.error();
  }
}
