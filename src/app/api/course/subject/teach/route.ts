import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

//POST /api/course/subject/teach
//Assign a subject to a teacher
export async function POST(request: Request) {
    const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
    if (error) return error;

    try {
        const body = await request.json();
        const { subject_id, user_id } = body;
        const newTeach = await db.teach.create({
            data: {
                subject_id: { connect: { id: subject_id } },
                user_id: { connect: { id: user_id } },
            }
        });
        return NextResponse.json(newTeach);
    } catch (error) {
        console.error('Error assigning subject to teacher:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}