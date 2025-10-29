import { db } from "@/lib/database";
import { NextResponse } from "next/server";

// GET /api/accounts
// get all accounts
export async function GET() {
  try {
    const accounts = await db.user.findMany(
        {
            select: {
                id: true,
                title: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            }
        }
    );
    return NextResponse.json(accounts, { status: 200 });
  }catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/accounts
// delete multiple accounts by ids (except SUPER_ADMIN)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Invalid or empty ids array" }, { status: 400 });
    }

    // Convert string ids to numbers
    const numericIds = ids.map(id => Number(id));

    // Check for SUPER_ADMIN accounts in the selection
    const superAdminAccounts = await db.user.findMany({
      where: {
        id: { in: numericIds },
        role: "SUPER_ADMIN"
      },
      select: { id: true, firstName: true, lastName: true }
    });

    if (superAdminAccounts.length > 0) {
      return NextResponse.json({ 
        message: "Cannot delete SUPER_ADMIN accounts",
        superAdminAccounts 
      }, { status: 403 });
    }

    // Delete the accounts
    const deletedAccounts = await db.user.deleteMany({
      where: {
        id: { in: numericIds },
        role: { not: "SUPER_ADMIN" } // Extra safety check
      }
    });

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedAccounts.count} account(s)`,
      deletedCount: deletedAccounts.count 
    }, { status: 200 });

  } catch (error) {
    console.error("Delete accounts error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}