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
        const { code, name, credit, language, isRequire, education_sectorId, course_yearId } = body;
        const { id } = await params;

        const updatedSubject = await db.subject.update({
            where: { id: Number(id) },
            data: {
                code,
                name,
                credit,
                language,
                isRequire,
                education_sectorId,
                course_yearId
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

//DELETE /api/course/subject/[id]
// Delete a specific subject
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
){
    try{
        const { id } = await params;
        const idNum = Number(id);
        if (!id || Number.isNaN(idNum)) {
            return NextResponse.json(
                { message: "Valid subject ID is required" },
                { status: 400 }
            );
        }

        // Ensure the record exists
        const existing = await db.subject.findUnique({ where: { id: idNum } });
        if (!existing) {
            return NextResponse.json(
                { message: "Subject not found" },
                { status: 404 }
            );
        }

        // Remove dependent teaching records first
        await db.teach.deleteMany({ where: { subjectId: idNum } });

        await db.subject.delete({
            where: { id: idNum },
        });
        return NextResponse.json({
            Message: "Subject deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting subject:", error);
        return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }
}
