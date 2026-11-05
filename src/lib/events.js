import prisma from '@/lib/db';
import seedEvents from '@/data/seedEvents';

// Parse 'YYYY-MM-DD' as a calendar date stored at UTC midnight.
export function parseDay(value) {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : null;
}

let seeded = false;
// Insert the bundled seed events when the table is empty. For seed events that
// already exist (matched by slug), add any newly bundled photos/videos.
export async function ensureSeedEvents() {
  if (seeded) return;
  const empty = (await prisma.event.count()) === 0;
  for (const { media, ...ev } of seedEvents) {
    const existing = empty
      ? null
      : await prisma.event.findUnique({ where: { slug: ev.slug }, include: { media: true } });
    if (empty) {
      await prisma.event.create({
        data: {
          ...ev,
          startDate: parseDay(ev.startDate),
          endDate: parseDay(ev.endDate),
          media: { create: media.map((m, i) => ({ ...m, sortOrder: i })) },
        },
      });
    } else if (existing) {
      const have = new Set(existing.media.map((m) => m.url));
      const missing = media.map((m, i) => ({ ...m, sortOrder: i })).filter((m) => !have.has(m.url));
      if (missing.length) {
        await prisma.eventMedia.createMany({ data: missing.map((m) => ({ ...m, eventId: existing.id })) });
        // Keep bundled files in seed order; user uploads stay after them.
        await prisma.$transaction(
          media.map((m, i) =>
            prisma.eventMedia.updateMany({ where: { eventId: existing.id, url: m.url }, data: { sortOrder: i } })
          )
        );
      }
    }
  }
  seeded = true;
}

// Normalise a request body into Prisma data for create/update.
export function eventDataFromBody(body, { partial = false } = {}) {
  const data = {};
  const str = (v) => (typeof v === 'string' ? v.trim() : v ?? null);

  if (!partial || 'title' in body) data.title = str(body.title);
  if (!partial || 'venue' in body) data.venue = str(body.venue);
  if (!partial || 'location' in body) data.location = str(body.location) || null;
  if (!partial || 'promotions' in body) data.promotions = str(body.promotions) || null;
  if (!partial || 'notes' in body) data.notes = str(body.notes) || null;
  if (!partial || 'storeKey' in body) data.storeKey = str(body.storeKey) || null;
  if (!partial || 'brands' in body) {
    const brands = Array.isArray(body.brands) ? body.brands : String(body.brands || '').split(/[,、\n]/);
    data.brands = brands.map((b) => String(b).trim()).filter(Boolean);
  }
  if (!partial || 'startDate' in body) data.startDate = parseDay(body.startDate);
  if (!partial || 'endDate' in body) data.endDate = parseDay(body.endDate);

  const errors = [];
  if ('title' in data && !data.title) errors.push('イベント名は必須です');
  if ('venue' in data && !data.venue) errors.push('会場は必須です');
  if ('startDate' in data && !data.startDate) errors.push('開始日が不正です');
  if ('endDate' in data && !data.endDate) errors.push('終了日が不正です');
  if (data.startDate && data.endDate && data.endDate < data.startDate) errors.push('終了日は開始日以降にしてください');
  return { data, errors };
}
