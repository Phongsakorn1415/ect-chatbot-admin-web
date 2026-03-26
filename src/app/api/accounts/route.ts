import { db } from "@/lib/database";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/utils/auth";

// GET /api/accounts
// get all accounts
export async function GET() {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  try {
    const accounts = await db.user.findMany({
      select: {
        id: true,
        title: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE /api/accounts
// delete multiple accounts by ids (except SUPER_ADMIN)
export async function DELETE(request: Request) {
  const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  const viewerRole = (session?.user as any).role;
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 },
      );
    }

    // Convert string ids to numbers
    const numericIds = ids.map((id) => Number(id));

    // Check for SUPER_ADMIN or ADMIN accounts in the selection depending on viewer role
    const sensitiveAccounts = await db.user.findMany({
      where: {
        id: { in: numericIds },
        OR: viewerRole === "ADMIN" 
          ? [ { role: "SUPER_ADMIN" }, { role: "ADMIN" } ]
          : [ { role: "SUPER_ADMIN" } ]
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (sensitiveAccounts.length > 0) {
      if (viewerRole === "ADMIN") {
        return NextResponse.json(
          {
            message: "ADMIN can only delete TEACHER accounts",
            sensitiveAccounts,
          },
          { status: 403 },
        );
      } else {
        return NextResponse.json(
          {
            message: "Cannot delete SUPER_ADMIN accounts",
            superAdminAccounts: sensitiveAccounts,
          },
          { status: 403 },
        );
      }
    }

    //delete relate teach
    await db.teach.deleteMany({
      where: { userId: { in: numericIds } },
    });

    //delete relate contact
    await db.contact.deleteMany({
      where: { userId: { in: numericIds } },
    });

    // Delete the accounts
    const deletedAccounts = await db.user.deleteMany({
      where: {
        id: { in: numericIds },
        role: viewerRole === "ADMIN" ? "TEACHER" : { not: "SUPER_ADMIN" }, // Extra safety check
      },
    });

    return NextResponse.json(
      {
        message: `Successfully deleted ${deletedAccounts.count} account(s)`,
        deletedCount: deletedAccounts.count,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete accounts error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
