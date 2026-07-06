import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST() {
  try {
    // Reset all data
    await prisma.normalizedSale.deleteMany({});
    await prisma.importLog.deleteMany({});
    await prisma.inventorySnapshot.deleteMany({});

    return NextResponse.json({ success: true, message: 'All data has been reset.' });
  } catch (error) {
    console.error('Reset Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
