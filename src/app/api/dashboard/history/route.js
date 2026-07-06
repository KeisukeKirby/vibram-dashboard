import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const logs = await prisma.importLog.findMany({
      orderBy: { importedAt: 'desc' },
      take: 50 // Limit to last 50
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
