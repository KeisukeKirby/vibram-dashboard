import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processFile } from '@/lib/parsers/index';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process file using our parsers
    const transactions = await processFile(buffer, file.name);

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
    }

    // Insert to NormalizedSale
    let inserted = 0;
    let failed = 0;
    
    // We can use createMany for bulk insert
    try {
      const res = await prisma.normalizedSale.createMany({
        data: transactions
      });
      inserted = res.count;
    } catch (e) {
      console.error('Failed to create many:', e);
      failed = transactions.length;
    }

    await prisma.importLog.create({
      data: {
        fileName: file.name,
        sourceType: transactions.length > 0 ? transactions[0].source_type : 'unknown',
        status: failed === 0 ? 'SUCCESS' : (inserted > 0 ? 'PARTIAL' : 'FAILED'),
        totalRows: transactions.length,
        failedRows: failed
      }
    });

    return NextResponse.json({ success: true, inserted, failed });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
