import prisma from '@/lib/db';

// Inclusive date range [startDate, endDate] for a stored event.
function periodWhere(ev) {
  const end = new Date(ev.endDate);
  end.setUTCDate(end.getUTCDate() + 1);
  return { store: ev.storeKey, date: { gte: new Date(ev.startDate), lt: end } };
}

export async function salesTotals(ev) {
  const agg = await prisma.normalizedSale.aggregate({
    where: periodWhere(ev),
    _sum: { amount: true, quantity: true },
    _count: true,
  });
  return { amount: agg._sum.amount || 0, quantity: agg._sum.quantity || 0, rows: agg._count };
}

export async function salesDetail(ev) {
  const where = periodWhere(ev);
  const [totals, byProduct, rows] = await Promise.all([
    salesTotals(ev),
    prisma.normalizedSale.groupBy({
      by: ['product_name'],
      where,
      _sum: { amount: true, quantity: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    }),
    prisma.normalizedSale.findMany({ where, select: { date: true, amount: true, quantity: true } }),
  ]);

  const daily = new Map();
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    const d = daily.get(key) || { date: key, amount: 0, quantity: 0 };
    d.amount += r.amount;
    d.quantity += r.quantity;
    daily.set(key, d);
  }

  return {
    ...totals,
    topProducts: byProduct.map((p) => ({
      product: p.product_name,
      amount: p._sum.amount || 0,
      quantity: p._sum.quantity || 0,
    })),
    daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
