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
    if (store) where.storeName = store;
    if (channel) where.salesChannel = channel;
    
    if (startDateStr || endDateStr) {
      where.date = {};
      if (startDateStr) where.date.gte = new Date(startDateStr);
      if (endDateStr) where.date.lte = new Date(endDateStr);
    }

    const aggregations = await prisma.salesTransaction.aggregate({
      _sum: {
        netSales: true,
        quantity: true,
        discountAmount: true,
      },
      _count: {
        id: true,
      },
      where
    });

    return NextResponse.json({
      totalSales: aggregations._sum.netSales || 0,
      totalQuantity: aggregations._sum.quantity || 0,
      totalDiscount: aggregations._sum.discountAmount || 0,
      transactions: aggregations._count.id || 0,
    });
  } catch (error) {
    console.error('Summary API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
