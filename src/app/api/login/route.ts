import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {

        const body = await req.json();
        const { email, password } = body;

        // Check if user exists
        const user = await db.User.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return NextResponse.json({ message: "Invalid password" }, { status: 401 });
        }

        return NextResponse.json({
            message: "Login successful", user: {
                id: user.id,
                email: user.email,
                firstname: user.firstName,
                lastname: user.lastName,
                role: user.role
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ message: "Error during login" }, { status: 500 });
    }
}