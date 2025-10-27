import { NextResponse } from "next/server";
import { db } from "@/lib/database";

//PATCH /api/course/subject/[id]
// Update a specific subject
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json();
        const { name, credit, language, isRequire, education_sectorId } = body;
        const { id } = await params;

        const updatedSubject = await db.subject.update({
            where: { id: Number(id) },
            data: {
                name,
                credit,
                language,
                isRequire,
                education_sectorId
            },
        });
        return NextResponse.json({
            Message: "Subject updated successfully",
            data: updatedSubject
        });
    } catch (error) {
        console.error("Error updating subject:", error);
        return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
    }
}
