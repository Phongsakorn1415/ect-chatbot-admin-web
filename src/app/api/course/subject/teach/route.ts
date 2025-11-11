import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//POST /api/course/subject/teach
//Assign a subject to a teacher
export async function POST(request: Request) {
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
        return NextResponse.error();
    }
}