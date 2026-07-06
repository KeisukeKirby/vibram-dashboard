import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get stock
    const inventory = await prisma.inventorySnapshot.findMany({
      orderBy: { snapshotDate: 'desc' }
    });

    // We'll keep track of unique products from inventory
    const uniqueItems = new Map();
    inventory.forEach(inv => {
      const key = `${inv.product_name}-${inv.color}-${inv.size}`;
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, inv);
      }
    });

    const alerts = [];

    // For each unique inventory item, find recent sales to calculate moving average
    // Because inventory might be empty initially, this will just return [] which is fine
    for (const [key, inv] of uniqueItems.entries()) {
      const recentSales = await prisma.normalizedSale.aggregate({
        _sum: { quantity: true },
        where: {
          product_name: inv.product_name,
          color: inv.color,
          size: inv.size,
          date: { gte: thirtyDaysAgo }
        }
      });

      const recentSalesQty = recentSales._sum.quantity || 0;
      const avgDailySales = recentSalesQty / 30;
      const currentStock = inv.stockQuantity;
      
      let daysOfSupply = avgDailySales > 0 ? currentStock / avgDailySales : (currentStock > 0 ? 999 : 0);
      const status = daysOfSupply < 14 ? 'Understock' : (daysOfSupply > 90 ? 'Overstock' : 'Healthy');

      alerts.push({
        id: inv.id,
        productName: inv.product_name,
        color: inv.color,
        size: inv.size,
        currentStock,
        avgDailySales: avgDailySales.toFixed(2),
        daysOfSupply: daysOfSupply === 999 ? '∞' : daysOfSupply.toFixed(0),
        status
      });
    }

    alerts.sort((a, b) => a.currentStock - b.currentStock);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Inventory API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
