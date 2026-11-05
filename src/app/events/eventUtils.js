export const day = (d) => (d ? String(d).slice(0, 10) : '');

// Today's date in Bangkok as YYYY-MM-DD.
export function todayBkk() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

export function eventStatus(ev, today = todayBkk()) {
  const s = day(ev.startDate);
  const e = day(ev.endDate);
  if (today < s) return { key: 'upcoming', label: '開催予定' };
  if (today > e) return { key: 'done', label: '終了' };
  return { key: 'live', label: '開催中' };
}

export function eventDays(ev) {
  const ms = new Date(day(ev.endDate)) - new Date(day(ev.startDate));
  return Math.round(ms / 86400000) + 1;
}

const fmt = (s) => {
  const [y, m, d] = s.split('-');
  return { y, m: Number(m), d: Number(d) };
};

export function formatRange(ev) {
  const a = fmt(day(ev.startDate));
  const b = fmt(day(ev.endDate));
  if (a.y === b.y) return `${a.y}/${a.m}/${a.d} – ${b.m}/${b.d}`;
  return `${a.y}/${a.m}/${a.d} – ${b.y}/${b.m}/${b.d}`;
}

export const baht = (n) => `฿${Math.round(n || 0).toLocaleString()}`;
