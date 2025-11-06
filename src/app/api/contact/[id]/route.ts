import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/contact/[id]
// Fetch contact information by contact ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

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
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    try {
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
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const { detail } = await req.json();

    try {
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