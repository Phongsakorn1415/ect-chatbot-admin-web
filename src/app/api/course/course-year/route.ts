import { db } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        const courseYears = await db.Course_year.findMany({
            orderBy: {
                year: 'desc'
            }
        });
        return NextResponse.json(
            { data: courseYears },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching course years:', error);
        return NextResponse.error();
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { year, normalFee, summerFee } = body;

        const newCourseYear = await db.Course_year.create({
            data: {
                year: year
            }
        });
        const TuitionFee = await db.Tuition_fees.create({
            data: {
                normal: normalFee?? 0,
                summer: summerFee?? 0,
                course_yearId: newCourseYear.id,
            }
        });
        return NextResponse.json(
            { data: { newCourseYear, TuitionFee } },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating course year:', error);
        return NextResponse.error();
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ message: "Course year ID is required" }, { status: 400 });
        }
        await db.Course_year.delete({
            where: { id: Number(id) }
        });
        await db.Tuition_fees.deleteMany({
            where: { course_yearId: Number(id) }
        });
        return NextResponse.json({ message: "Course year deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting course year:', error);
        return NextResponse.error();
    }
}
