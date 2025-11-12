import { db } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

//DELETE /api/course/subject/teach/[id]
//Remove a teaching assignment by its ID
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const teachIdNum = Number(id);
        if (!Number.isFinite(teachIdNum)) {
            return NextResponse.json({ error: "Invalid teach id" }, { status: 400 });
        }
        await db.teach.delete({
            where: { id: teachIdNum }
        });
        return NextResponse.json({ message: "Teaching assignment removed successfully" });
    } catch (error) {
        console.error('Error removing teaching assignment:', error);
        return NextResponse.error();
    }
}