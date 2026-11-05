import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ensureSeedEvents, eventDataFromBody } from '@/lib/events';
import { salesTotals } from '@/lib/eventSales';

export async function GET() {
  try {
    await ensureSeedEvents();
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });

    const result = await Promise.all(
      events.map(async ({ media, ...ev }) => {
        const cover = media.find((m) => m.type === 'image') || media.find((m) => m.posterUrl);
        return {
          ...ev,
          coverUrl: cover ? (cover.type === 'image' ? cover.url : cover.posterUrl) : null,
          photoCount: media.filter((m) => m.type === 'image').length,
          videoCount: media.filter((m) => m.type === 'video').length,
          sales: ev.storeKey ? await salesTotals(ev) : null,
        };
      })
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, errors } = eventDataFromBody(body);
    if (errors.length) return NextResponse.json({ error: errors.join(' / ') }, { status: 400 });
    const event = await prisma.event.create({ data });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create Event Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
