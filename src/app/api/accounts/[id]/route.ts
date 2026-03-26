import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

// GET /api/accounts/[id]
// get account by id
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
    if (error) return error;

    try {
        const { id } = await params;
        const account = await db.user.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                email: true,
                title: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        if (!account) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ data: account }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// PATH /api/accounts/[id]
// edit account by id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
    if (error) return error;

    const viewerRole = (session?.user as any).role;
    const viewerId = (session?.user as any).id;

    try {
        const { id } = params;
        const body = await request.json();
        const { title, firstName, lastName, role, name_embedding } = body;

        // Fetch target user to enforce role constraints
        const target = await db.user.findUnique({
            where: { id: Number(id) },
            select: { role: true, id: true },
        });

        if (!target) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 1. ADMIN cannot edit other ADMIN or SUPER_ADMIN (except themselves)
        if (viewerRole === 'ADMIN' && target.id !== Number(viewerId)) {
            if (target.role === 'ADMIN' || target.role === 'SUPER_ADMIN') {
                return NextResponse.json({ message: 'ADMIN cannot edit other ADMIN or SUPER ADMIN accounts' }, { status: 403 });
            }
        }

        // 2. ADMIN cannot change roles at all (only SUPER_ADMIN can)
        if (viewerRole === 'ADMIN' && role && role !== target.role) {
            return NextResponse.json({ message: 'ADMIN cannot change user roles' }, { status: 403 });
        }

        // 3. TARGET is SUPER_ADMIN: role cannot be changed by anyone (even self via this endpoint)
        if (target.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot change role of SUPER ADMIN' }, { status: 403 });
        }

        // 4. Assigning SUPER_ADMIN role is forbidden
        if (target.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot assign SUPER ADMIN role' }, { status: 403 });
        }

        const updatedAccount = await db.user.update({
            where: { id: Number(id) },
            data: {
                title,
                firstName,
                lastName,
                // Only update role if it's different and not forbidden by checks above
                ...(role && role !== target.role ? { role } : {}),
            }
        });

        if (name_embedding === null) {
            await db.$executeRaw`UPDATE "User" SET "name_embedding" = NULL WHERE "id" = ${Number(id)}`;
        }

        return NextResponse.json({ message: "User updated successfully", updatedAccount }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/accounts/[id]
// delete account by id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
    if (error) return error;

    const viewerRole = (session?.user as any).role;

    try {
        const { id } = params;

        // Fetch target user 
        const target = await db.user.findUnique({
            where: { id: Number(id) },
            select: { role: true },
        });

        if (!target) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Protection for SUPER_ADMIN
        if (target.role === 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot delete SUPER ADMIN account' }, { status: 403 });
        }

        // ADMIN can only delete TEACHER
        if (viewerRole === 'ADMIN' && target.role !== 'TEACHER') {
            return NextResponse.json({ message: 'ADMIN can only delete TEACHER accounts' }, { status: 403 });
        }

        //remove related teach records
        await db.teach.deleteMany({
            where: { userId: Number(id) },
        });

        const deletedAccount = await db.user.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json({ message: "User deleted successfully", deletedAccount }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}