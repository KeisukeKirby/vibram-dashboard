import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deleteBlobs } from '@/lib/eventBlob';

export async function PATCH(request, { params }) {
  try {
    const { id, mediaId } = await params;
    const { caption } = await request.json();
    const res = await prisma.eventMedia.updateMany({
      where: { id: mediaId, eventId: id },
      data: { caption: caption?.trim() || null },
    });
    if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, mediaId } = await params;
    const media = await prisma.eventMedia.findFirst({ where: { id: mediaId, eventId: id } });
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.eventMedia.delete({ where: { id: mediaId } });
    await deleteBlobs([media.url, media.posterUrl]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
