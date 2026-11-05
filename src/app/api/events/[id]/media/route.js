import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Register files already uploaded to Vercel Blob (see /api/events/upload).
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items is required' }, { status: 400 });
    }

    const last = await prisma.eventMedia.findFirst({
      where: { eventId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let order = (last?.sortOrder ?? -1) + 1;

    const data = items
      .filter((it) => typeof it.url === 'string' && it.url)
      .map((it) => ({
        eventId: id,
        type: it.type === 'video' ? 'video' : 'image',
        url: it.url,
        posterUrl: it.posterUrl || null,
        caption: it.caption?.trim() || null,
        sortOrder: order++,
      }));

    await prisma.eventMedia.createMany({ data });
    return NextResponse.json({ added: data.length }, { status: 201 });
  } catch (error) {
    console.error('Add Media Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
