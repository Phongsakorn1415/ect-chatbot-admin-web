import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/course/subject
// Retrieve all subjects
export async function GET() {
  try {
    const subjects = await db.subject.findMany();
    return NextResponse.json({ data: subjects });
  }catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

//POST /api/course/subject
// Create a new subject
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, credit, language, isRequire, education_sectorId, course_yearId } = body;
        const newSubject = await db.subject.create({
            data: {
                name,
                credit,
                language,
                isRequire,
                education_sectorId : education_sectorId ?? null,
                course_yearId
            },
        });
        return NextResponse.json({
            Message: "Subject created successfully",
            data: newSubject
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
    }
}