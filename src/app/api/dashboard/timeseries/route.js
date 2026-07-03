import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store');
    const channel = searchParams.get('channel');
    
    const where = {};
    if (store) where.storeName = store;
    if (channel) where.salesChannel = channel;

    // Prisma doesn't natively support easy GROUP BY date with different granularities in SQLite
    // We'll fetch the data and group in memory for this scale, or use raw SQL.
    // For SQLite, raw SQL is better:
    
    let query = `
      SELECT 
        date, 
        SUM(netSales) as totalSales, 
        SUM(quantity) as totalQty 
      FROM SalesTransaction
      WHERE 1=1
    `;
    
    // Simple parameterized query simulation (Prisma $queryRaw is safer)
    const conditions = [];
    if (store) conditions.push(prisma.sql`storeName = ${store}`);
    if (channel) conditions.push(prisma.sql`salesChannel = ${channel}`);
    
    // But since Prisma's queryRaw requires careful syntax with dynamic WHERE, we will fetch and group in memory.
    const transactions = await prisma.salesTransaction.findMany({
      where,
      select: {
        date: true,
        netSales: true,
        quantity: true,
      },
      orderBy: { date: 'asc' }
    });

    const grouped = transactions.reduce((acc, tx) => {
      // Group by ISO date string (YYYY-MM-DD)
      const dateKey = tx.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalSales: 0, totalQty: 0 };
      }
      acc[dateKey].totalSales += (tx.netSales || 0);
      acc[dateKey].totalQty += (tx.quantity || 0);
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Timeseries API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
