import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const transactions = await prisma.salesTransaction.findMany({
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });

    // Group by Category
    const categoryGroup = {};
    const channelGroup = {};

    transactions.forEach(tx => {
      const cat = tx.variant?.product?.category || 'Unknown';
      const channel = tx.salesChannel || 'Unknown';
      const sales = tx.netSales || 0;

      if (!categoryGroup[cat]) categoryGroup[cat] = 0;
      categoryGroup[cat] += sales;

      if (!channelGroup[channel]) channelGroup[channel] = 0;
      channelGroup[channel] += sales;
    });

    const categories = Object.keys(categoryGroup).map(name => ({ name, value: categoryGroup[name] }));
    const channels = Object.keys(channelGroup).map(name => ({ name, value: channelGroup[name] }));

    return NextResponse.json({ categories, channels });
  } catch (error) {
    console.error('Composition API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
