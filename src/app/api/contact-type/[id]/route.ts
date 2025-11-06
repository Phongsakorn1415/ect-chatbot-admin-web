import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/contact-type/[id]
//Fetch a specific contact type by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    try {
        const contactType = await db.contact_type.findUnique({
            where: { id: Number(id) },
        });

        if (!contactType) {
            return NextResponse.json({ error: "Contact type not found" }, { status: 404 });
        }

        return NextResponse.json({ data: contactType });
    } catch (error) {
        console.error("Error fetching contact type:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

//PATCH /api/contact-type/[id]
//Update a contact type
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const { type } = await req.json();

    try {
        const updatedContactType = await db.contact_type.update({
            where: { id: Number(id) },
            data: { type_name: type },
        });

        return NextResponse.json({ data: updatedContactType });
    } catch (error) {
        console.error("Error updating contact type:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

//DELETE /api/contact-type/[id]
//Delete a contact type
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    try {
        await db.contact_type.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "Contact type deleted successfully" });
    } catch (error) {
        console.error("Error deleting contact type:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}