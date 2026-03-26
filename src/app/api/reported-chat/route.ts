import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import dayjs from 'dayjs';
import { requireAuth } from '@/lib/utils/auth';

export async function GET(request: Request) {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let whereClause: any = {
      isReported: true,
    };

    if (startDateParam) {
      const startDate = dayjs(startDateParam).startOf('day').toDate();
      let endDate = dayjs().endOf('day').toDate(); // default to now

      if (endDateParam) {
        endDate = dayjs(endDateParam).endOf('day').toDate();
      }

      whereClause.reportedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const logs = await db.chatLog.findMany({
      where: whereClause,
      orderBy: {
        reportedAt: 'desc',
      },
      select: {
        id: true,
        userMessage: true,
        toolUsed: true,
        aiResponse: true,
        toolResult: true,
        toolsArguments: true,
        chatHistory: true,
        createdAt: true,
        reportedAt: true,
        reportMessage: true,
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching reported chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if (error) return error;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid ids' }, { status: 400 });
    }

    await db.chatLog.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reported chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
