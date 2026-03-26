import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

// GET /api/accounts/[id]/contact
// Fetch contact information for a specific account
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
  if (error) return error;

  const { id: accountId } = await params;
  const contactInfo = await db.contact.findMany({
    select: {
      id: true,
      contact_detail: true,
      contact_type: {
        select: {
          id: true,
          type_name: true,
        },
      },
    },
    where: { userId: Number(accountId) },
  });
  return NextResponse.json(contactInfo);
}

// POST /api/accounts/[id]/contact
// Add new contact information for a specific account
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
  if (error) return error;

  const { id: accountId } = await params;
  const viewer = session?.user as any;

  // RBAC Checks
  if (viewer.role === "TEACHER") {
    if (viewer.id !== Number(accountId)) {
      return NextResponse.json({ message: "Forbidden: TEACHER can only add contacts to their own account" }, { status: 403 });
    }
  } else if (viewer.role === "ADMIN") {
    // Check if target account is TEACHER
    const target = await db.user.findUnique({
      where: { id: Number(accountId) },
      select: { role: true }
    });
    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (target.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden: ADMIN can only add contacts to TEACHER accounts" }, { status: 403 });
    }
  }

  const { detail, type_id } = await request.json();

  const newContact = await db.contact.create({
    data: {
      contact_detail: detail,
      contact_type: {
        connect: { id: type_id },
      },
      user: {
        connect: { id: Number(accountId) },
      },
    },
  });

  return NextResponse.json(newContact);
}
