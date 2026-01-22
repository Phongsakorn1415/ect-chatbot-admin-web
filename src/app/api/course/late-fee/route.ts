import { db } from "@/lib/database";
import { NextResponse } from "next/server";
import { FeeUnit } from "@prisma/client";

// GET /api/course/late-fee
// Return the single late registration fee record. If not found, return default.
export async function GET() {
  try {
    const fee = await db.late_registration_fee.findFirst();
    if (!fee) {
      // Return default structure if no record exists yet
      return NextResponse.json(
        {
          data: {
            rate: 0,
            unit: FeeUnit.DAY,
            max_amount: 0,
          },
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ data: fee }, { status: 200 });
  } catch (error) {
    console.error("Error fetching late fee:", error);
    return NextResponse.error();
  }
}

// POST /api/course/late-fee
// Update or create the single late registration fee record.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { rate, unit, max_amount } = body ?? {};

    // Validate if needed, but for now allow 0.
    // unit should be one of FeeUnit enum values.

    const existing = await db.late_registration_fee.findFirst();

    let saved;
    if (existing) {
      saved = await db.late_registration_fee.update({
        where: { id: existing.id },
        data: {
          rate: rate ?? existing.rate,
          unit: (unit as FeeUnit) ?? existing.unit,
          max_amount: max_amount ?? existing.max_amount,
        },
      });
    } else {
      saved = await db.late_registration_fee.create({
        data: {
          rate: rate ?? 0,
          unit: (unit as FeeUnit) ?? FeeUnit.DAY,
          max_amount: max_amount ?? 0,
        },
      });
    }

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (error) {
    console.error("Error saving late fee:", error);
    return NextResponse.error();
  }
}
