import { db } from "@/lib/database";
import { NextResponse } from "next/server";

// GET /api/accounts/[id]/contact
// Fetch contact information for a specific account
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const accountId = params.id;
    const contactInfo = await db.contact.findMany({
        select:{
            id: true,
            contact_detail: true,
            contact_type: {
                select: {
                    id: true,
                    type_name: true,
                }
            },
        },
        where: { userId: Number(accountId) },
    });
    return NextResponse.json(contactInfo);
}

// POST /api/accounts/[id]/contact
// Add new contact information for a specific account
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const accountId = params.id;
    const { detail, type_id } = await request.json();

    const newContact = await db.contact.create({
        data: {
            contact_detail: detail,
            contact_type: {
                connect: { id: type_id }
            },
            user: {
                connect: { id: Number(accountId) }
            }
        }
    });

    return NextResponse.json(newContact);
}