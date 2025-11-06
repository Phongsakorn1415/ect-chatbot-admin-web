import { db } from "@/lib/database";
import { NextResponse } from "next/server";

//GET /api/contact-type
//Fetch all contact types
export async function GET() {
    const contactTypes = await db.contact_type.findMany();
    return NextResponse.json({ data : contactTypes }, { status: 200 });
}

//POST /api/contact-type
//Create a new contact type
export async function POST(request: Request) {
    const { type } = await request.json();
    const newContactType = await db.contact_type.create({
        data: {
            type_name: type,
        }
    });

    return NextResponse.json({ 
        message: "Contact type created successfully",
        data: newContactType 
    }, { status: 201 });
}