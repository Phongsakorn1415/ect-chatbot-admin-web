import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// GET /api/accounts/[id]
// get account by id
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
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
        return NextResponse.error();
    }
}

//PATH /api/accounts/[id]
// edit account by id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { title, firstName, lastName, role } = body;

        // Fetch current user to enforce role constraints
        const current = await db.user.findUnique({
            where: { id: Number(id) },
            select: { role: true },
        });
        if (!current) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Disallow changing role of SUPER_ADMIN
        if (current.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot change role of SUPER ADMIN' }, { status: 403 });
        }
        // Disallow setting any user to SUPER_ADMIN via this endpoint
        if (current.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot assign SUPER ADMIN role' }, { status: 403 });
        }

        const updatedAccount = await db.user.update({
            where: { id: Number(id) },
            data: {
                title,
                firstName,
                lastName,
                // Only update role if allowed per constraints above
                ...(role ? { role } : {}),
            }
        });
        return NextResponse.json({ message: "User updated successfully", updatedAccount }, { status: 200 });
    } catch (error) {
        return NextResponse.error();
    }
}

// DELETE /api/accounts/[id]
// delete account by id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const deletedAccount = await db.user.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json({ message: "User deleted successfully", deletedAccount }, { status: 200 });
    } catch (error) {
        return NextResponse.error();
    }
}