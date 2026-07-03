import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    // Basic inventory analysis. 
    // In a real scenario, this involves complex calculations over time.
    // For this prototype, we'll fetch products, their total sales over the last 30 days,
    // and compare it to their most recent stock snapshot.

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const variants = await prisma.productVariant.findMany({
      include: {
        product: true,
        salesTransactions: {
          where: { date: { gte: thirtyDaysAgo } }
        },
        inventorySnapshots: {
          orderBy: { snapshotDate: 'desc' },
          take: 1
        }
      }
    });

    const alerts = [];

    variants.forEach(v => {
      const recentSalesQty = v.salesTransactions.reduce((acc, tx) => acc + tx.quantity, 0);
      const avgDailySales = recentSalesQty / 30; // simple moving average
      
      const currentStock = v.inventorySnapshots.length > 0 ? v.inventorySnapshots[0].stockQuantity : 0;
      
      let daysOfSupply = avgDailySales > 0 ? currentStock / avgDailySales : (currentStock > 0 ? 999 : 0);

      const status = daysOfSupply < 14 ? 'Understock' : (daysOfSupply > 90 ? 'Overstock' : 'Healthy');

      // Only push if there's stock data or sales data
      if (currentStock > 0 || recentSalesQty > 0) {
        alerts.push({
          id: v.id,
          productName: v.product.baseProductName,
          color: v.color,
          size: v.size,
          currentStock,
          avgDailySales: avgDailySales.toFixed(2),
          daysOfSupply: daysOfSupply === 999 ? '∞' : daysOfSupply.toFixed(0),
          status
        });
      }
    });

    alerts.sort((a, b) => a.currentStock - b.currentStock); // lowest stock first

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Inventory API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
