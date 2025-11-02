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
                title: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            }
        });
        if (!account) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ account }, { status: 200 });
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
        const { title, firstName, lastName, role, password } = body;

        const dataBody: any = {
            title,
            firstName,
            lastName,
            role,
        };

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            dataBody.hashedPassword = hashedPassword;
        }

        const updatedAccount = await db.user.update({
            where: { id: Number(id) },
            data: {
                title,
                firstName,
                lastName,
                role,
                passwordHash: dataBody.hashedPassword ?? undefined,
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