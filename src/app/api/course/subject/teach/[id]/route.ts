import { db } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

//DELETE /api/course/subject/teach/[id]
//Remove a teaching assignment by its ID
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
    const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
    if (error) return error;

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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}