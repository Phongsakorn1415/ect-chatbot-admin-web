import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

//PATCH /api/course/course-year/[id]
// Update a specific course year
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const idNum = Number(id);
        if (!id || Number.isNaN(idNum)) {
            return NextResponse.json(
                { message: 'Valid course year ID is required' },
                { status: 400 }
            );
        }

        // Update the course year
        const body = await req.json();
        const updated = await db.course_year.update({
            where: { id: idNum },
            data: body
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating course year:', error);
        return NextResponse.json({ message: 'Failed to update course year' }, { status: 500 });
    }
}

// DELETE /api/course/course-year/[id]
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const idNum = Number(id);
        if (!id || Number.isNaN(idNum)) {
            return NextResponse.json(
                { message: 'Valid course year ID is required' },
                { status: 400 }
            );
        }

        // Ensure the record exists
    const existing = await db.course_year.findUnique({ where: { id: idNum } });
        if (!existing) {
            return NextResponse.json(
                { message: 'Course year not found' },
                { status: 404 }
            );
        }

        // Remove dependent records first (defensive; Tuition_fees has onDelete: Cascade but keep order safe)
    await db.tuition_fees.deleteMany({ where: { course_yearId: idNum } });

        // Delete the course year
    await db.course_year.delete({ where: { id: idNum } });

        return NextResponse.json({ message: 'Course year deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting course year:', error);
        return NextResponse.json({ message: 'Failed to delete course year' }, { status: 500 });
    }
}