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
        product_name: true,
        color: true,
        size: true,
        quantity: true,
        amount: true
      }
    });

    // Group by product_name -> color -> size
    const productsMap = {};

    transactions.forEach(tx => {
      const name = tx.product_name || 'Unknown';
      const color = tx.color || 'Unknown';
      const size = tx.size || 'Unknown';

      if (!productsMap[name]) {
        productsMap[name] = { name, quantity: 0, amount: 0, colors: {} };
      }
      
      productsMap[name].quantity += tx.quantity;
      productsMap[name].amount += tx.amount;

      if (!productsMap[name].colors[color]) {
        productsMap[name].colors[color] = { name: color, quantity: 0, amount: 0, sizes: {} };
      }

      productsMap[name].colors[color].quantity += tx.quantity;
      productsMap[name].colors[color].amount += tx.amount;

      if (!productsMap[name].colors[color].sizes[size]) {
        productsMap[name].colors[color].sizes[size] = { name: size, quantity: 0, amount: 0 };
      }

      productsMap[name].colors[color].sizes[size].quantity += tx.quantity;
      productsMap[name].colors[color].sizes[size].amount += tx.amount;
    });

    // Format for easy consumption
    const result = Object.values(productsMap).map(p => ({
      ...p,
      colors: Object.values(p.colors).map(c => ({
        ...c,
        sizes: Object.values(c.sizes)
      }))
    }));

    result.sort((a, b) => b.amount - a.amount); // Sort by highest revenue

    return NextResponse.json(result);
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
