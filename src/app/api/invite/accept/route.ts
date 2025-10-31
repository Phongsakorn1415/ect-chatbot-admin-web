import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/invite/accept?token=xxxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing token parameter" },
        { status: 400 }
      );
    }

    // Check if the invite token exists in the database
    const invite = await db.invite.findUnique({ where: { token } });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Invite accepted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

//POST /api/invite/accept
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, title, firstName, lastName } = body;

    // Check if the invite token exists in the database
    const invite = await db.invite.findUnique({ where: { token } });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    //Check if password is provided
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    //check if user with the same email already exists
    const existingUser = await db.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    //Check title, firstName, lastName
    if(!title && !invite.title){
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    if(!firstName && !invite.firstName){
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }
    if(!lastName && !invite.lastName){
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }

    // Create the user account
    const newUser = await db.user.create({
      data: {
        email: invite.email,
        passwordHash: password,
        title: title || invite.title,
        firstName : firstName || invite.firstName,
        lastName: lastName || invite.lastName,
        role: invite.role,
      },
    });

    return NextResponse.json({ message: "Invite accepted" });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
