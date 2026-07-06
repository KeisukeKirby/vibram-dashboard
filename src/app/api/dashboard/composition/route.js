import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const transactions = await prisma.normalizedSale.findMany({
      select: {
        product_name: true,
        store: true,
        channel: true,
        amount: true
      }
    });

    const productGroup = {};
    const storeGroup = {};
    const channelGroup = {};

    transactions.forEach(tx => {
      const prod = tx.product_name || 'Unknown';
      const store = tx.store || 'Unknown';
      const channel = tx.channel || 'Unknown';
      const sales = tx.amount || 0;

      if (!productGroup[prod]) productGroup[prod] = 0;
      productGroup[prod] += sales;

      if (!storeGroup[store]) storeGroup[store] = 0;
      storeGroup[store] += sales;

      if (!channelGroup[channel]) channelGroup[channel] = 0;
      channelGroup[channel] += sales;
    });

    // Sort and take top N for products to avoid huge pie charts
    const products = Object.keys(productGroup)
      .map(name => ({ name, value: productGroup[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
      
    const stores = Object.keys(storeGroup).map(name => ({ name, value: storeGroup[name] }));
    const channels = Object.keys(channelGroup).map(name => ({ name, value: channelGroup[name] }));

    return NextResponse.json({ products, stores, channels });
  } catch (error) {
    console.error('Composition API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
