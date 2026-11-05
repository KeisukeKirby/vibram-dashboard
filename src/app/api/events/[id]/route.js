import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { eventDataFromBody } from '@/lib/events';
import { salesDetail } from '@/lib/eventSales';
import { deleteBlobs } from '@/lib/eventBlob';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
    if (!event) return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });

    const stores = await prisma.normalizedSale.findMany({
      distinct: ['store'],
      select: { store: true },
      orderBy: { store: 'asc' },
    });

    return NextResponse.json({
      ...event,
      sales: event.storeKey ? await salesDetail(event) : null,
      stores: stores.map((s) => s.store),
    });
  } catch (error) {
    console.error('Event API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, errors } = eventDataFromBody(body, { partial: true });
    if (errors.length) return NextResponse.json({ error: errors.join(' / ') }, { status: 400 });

    const current = await prisma.event.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
    const start = data.startDate ?? current.startDate;
    const end = data.endDate ?? current.endDate;
    if (end < start) return NextResponse.json({ error: '終了日は開始日以降にしてください' }, { status: 400 });

    const event = await prisma.event.update({ where: { id }, data });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Update Event Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const media = await prisma.eventMedia.findMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });
    await deleteBlobs(media.flatMap((m) => [m.url, m.posterUrl]));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete Event Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
