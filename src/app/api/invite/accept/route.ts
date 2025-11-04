import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

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

    // include status so client can handle expired/accepted states gracefully
    const isExpired = invite.status === "EXPIRED";
    return NextResponse.json({
      message: "Invite fetched",
      invite: {
        title: invite.title || null,
        firstName: invite.firstName || null,
        lastName: invite.lastName || null,
        status: invite.status,
        expired: isExpired,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

//POST /api/invite/accept
//register user with invite token
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

    // Validate invite status
    if (invite.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Invite token has expired" },
        { status: 410 }
      );
    }
    if (invite.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Invite has already been used" },
        { status: 409 }
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

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the user account
    const newUser = await db.user.create({
      data: {
        email: invite.email,
        passwordHash: passwordHash,
        title: title || invite.title,
        firstName : firstName || invite.firstName,
        lastName: lastName || invite.lastName,
        role: invite.role,
      },
    });

    //update invite status to accepted
    await db.invite.update({
      where: { token },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({ message: "Invite accepted" });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
