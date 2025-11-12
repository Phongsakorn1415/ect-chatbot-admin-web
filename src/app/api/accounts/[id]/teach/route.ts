import { db } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET /api/accounts/[id]/teach or /api/accounts/[id]/teach?course_year=2023
// Fetch contact information for a specific account optionally filtered by course year
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const accountIdNum = Number(id);
        if (!Number.isFinite(accountIdNum)) {
            return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
        }

        // Parse optional filter: ?course_year=2023
        const url = new URL(request.url);
        const courseYearParam = url.searchParams.get("course_year");
        const courseYearNum = courseYearParam ? Number(courseYearParam) : undefined;

        // Build where clause; filtering on related subject's Course_year_id.year
        const where: any = {
            userId: accountIdNum,
            ...(courseYearParam && Number.isFinite(courseYearNum)
                ? {
                    subject_id: {
                        is: {
                            Course_year_id: {
                                is: { year: courseYearNum }
                            }
                        }
                    }
                }
                : {})
        };

        const data = await db.teach.findMany({
            where,
            select: {
                id: true,
                subject_id: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        Course_year_id: {
                            select: {
                                id: true,
                                year: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(data);
    } catch (err) {
        console.error("GET /api/accounts/[id]/teach error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}