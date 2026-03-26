import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

//GET /api/contact/[id]
// Fetch contact information by contact ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const contact = await db.contact.findUnique({
            where: { id: Number(id) },
        });

        if (!contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        return NextResponse.json({ data: contact });
    } catch (error) {
        console.error("Error fetching contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/contact/[id]
// Delete contact information by contact ID
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
    if (error) return error;

    const { id } = await params;
    const viewer = session?.user as any;

    try {
        // Fetch contact to check ownership
        const contact = await db.contact.findUnique({
            where: { id: Number(id) },
            include: { user: { select: { id: true, role: true } } }
        });

        if (!contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        // RBAC Checks
        if (viewer.role === "TEACHER") {
            if (viewer.id !== contact.userId) {
                return NextResponse.json({ message: "Forbidden: TEACHER can only delete their own contacts" }, { status: 403 });
            }
        } else if (viewer.role === "ADMIN") {
            if (contact.user.role !== "TEACHER" && contact.userId !== viewer.id) {
                return NextResponse.json({ message: "Forbidden: ADMIN can only delete TEACHER contacts" }, { status: 403 });
            }
        }

        await db.contact.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "Contact deleted successfully" });
    } catch (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

//PATCH /api/contact/[id]
// Update contact information by contact ID
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { session, error } = await requireAuth(["SUPER_ADMIN", "ADMIN", "TEACHER"]);
    if (error) return error;

    const { id } = await params;
    const viewer = session?.user as any;
    const { detail } = await req.json();

    try {
        // Fetch contact to check ownership
        const contact = await db.contact.findUnique({
            where: { id: Number(id) },
            include: { user: { select: { id: true, role: true } } }
        });

        if (!contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        // RBAC Checks
        if (viewer.role === "TEACHER") {
            if (viewer.id !== contact.userId) {
                return NextResponse.json({ message: "Forbidden: TEACHER can only update their own contacts" }, { status: 403 });
            }
        } else if (viewer.role === "ADMIN") {
            if (contact.user.role !== "TEACHER" && contact.userId !== viewer.id) {
                return NextResponse.json({ message: "Forbidden: ADMIN can only update TEACHER contacts" }, { status: 403 });
            }
        }

        const updatedContact = await db.contact.update({
            where: { id: Number(id) },
            data: { contact_detail: detail },
        });

        return NextResponse.json({ data: updatedContact });
    } catch (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}