import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store');
    const channel = searchParams.get('channel');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    
    const where = {};
    if (store) where.store = store;
    if (channel) where.channel = channel;
    
    if (startDateStr || endDateStr) {
      where.date = {};
      if (startDateStr) where.date.gte = new Date(startDateStr);
      if (endDateStr) where.date.lte = new Date(endDateStr);
    }

    const transactions = await prisma.normalizedSale.findMany({
      where,
      select: {
        date: true,
        amount: true,
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
      acc[dateKey].totalSales += (tx.amount || 0);
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
