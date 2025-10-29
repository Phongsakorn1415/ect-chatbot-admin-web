import { db } from "@/lib/database";
import { NextResponse } from "next/server";

// GET /api/course/course-fee/[id]
// Return tuition fee by course year id (path param)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Invalid or missing course year id" },
        { status: 400 }
      );
    }

    const courseFee = await db.tuition_fees.findFirst({
      where: { course_yearId: idNum },
    });

    if (!courseFee) {
      return NextResponse.json(
        { message: "Course fee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: courseFee }, { status: 200 });
  } catch (error) {
    console.error("Error fetching course fee:", error);
    return NextResponse.error();
  }
}

// POST /api/course/course-fee/[id]
// Upsert tuition fee for a given course year id (path param)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return NextResponse.json(
        { message: "Invalid or missing course year id" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { normal, summer } = body ?? {};

    const existing = await db.tuition_fees.findFirst({
      where: { course_yearId: idNum },
    });

    let saved;
    if (existing) {
      saved = await db.tuition_fees.update({
        where: { id: existing.id },
        data: {
          normal: normal ?? existing.normal ?? 0,
          summer: summer ?? existing.summer ?? 0,
        },
      });
    } else {
      saved = await db.tuition_fees.create({
        data: {
          course_yearId: idNum,
          normal: normal ?? 0,
          summer: summer ?? 0,
        },
      });
    }

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (error) {
    console.error("Error upserting course fee:", error);
    return NextResponse.error();
  }
}
