import { NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function POST( req : Request ) {
  try{
    const body = await req.json();
    const { email, title, firstName, lastName, inviterID } = body;

    //check if user email already exists
    const existingUserEmail = await db.User.findUnique({
      where: {
        email: email
      }
    });
    if (existingUserEmail) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    const existingInvite = await db.Invite.findFirst({
      where: {
        email: email,
        status: {
          not: 'EXPIRED'
        }
      }
    });

    // Check for existing invites and update status if expired
    const existingInvites = await db.Invite.findMany({
      where: {
        email: email,
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }
    });

    // Update expired invites
    if (existingInvites.length > 0) {
    interface Invites {
        id: string;
        email: string;
        status: 'PENDING' | 'EXPIRED';
        createdAt: Date;
    }

    await db.Invite.updateMany({
        where: {
            id: {
                in: existingInvites.map((invite: Invites) => invite.id)
            }
        },
        data: {
            status: 'EXPIRED' as const
        }
    });
    }

    if (existingInvite) {
      return NextResponse.json({ message: "Active invitation already exists for this email" }, { status: 409 });
    }

    // Create new invite
    const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2); // Generate a simple token
    const link = `http://localhost:3000/verify-invite?token=${token}`; // Replace with your actual domain
    const newInvite = await db.Invite.create({
      data: {
        email: email,
        title: title,
        firstName: firstName,
        lastName: lastName,
        status: 'PENDING',
        token: token,
        link: link,
        invitedById: inviterID
      }
    });

    return NextResponse.json({ message: "invite successful", data: body }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error during create invitetation" }, { status: 500 });
  }
}