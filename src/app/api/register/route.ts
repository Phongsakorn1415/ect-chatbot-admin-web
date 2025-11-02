import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, title, firstName, lastName, role } = body;

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 409 });
        }
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        // Create user
        const newUser = await db.user.create({
            data: {
                email: email,
                passwordHash: passwordHash,
                title: title,
                firstName: firstName,
                lastName: lastName,
                role: role
            }
        });

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return NextResponse.json({ message: "User created successfully", user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "register Error" }, { status: 500 });
    }
}