import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processFile } from '@/lib/parsers/index';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const storeName = formData.get('storeName');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process file using our parsers
    const transactions = await processFile(buffer, file.name, { storeName });

    let successCount = 0;
    let failCount = 0;

    // We can't do parallel Promise.all safely with SQLite in large chunks without locking issues, 
    // doing a sequential loop for simplicity in local environments. 
    for (const tx of transactions) {
      try {
        const { baseProductName, color, size, brand, category } = tx.parsedProduct;
        
        // Find or create product
        let product = await prisma.product.findUnique({
          where: { baseProductName }
        });

        if (!product) {
          product = await prisma.product.create({
            data: { baseProductName, brand, category }
          });
        }

        // Find or create variant
        const variants = await prisma.productVariant.findMany({
          where: { productId: product.id, color, size }
        });

        let variant;
        if (variants.length > 0) {
          variant = variants[0];
        } else {
          variant = await prisma.productVariant.create({
            data: { productId: product.id, color, size }
          });
        }

        // Avoid exact duplicates (same file, date, store, variant, qty) for idempotency
        // This is a simple duplicate check
        const existingTx = await prisma.salesTransaction.findFirst({
          where: {
            sourceFileName: tx.sourceFileName,
            date: tx.date,
            storeName: tx.storeName,
            variantId: variant.id,
            quantity: tx.quantity
          }
        });

        if (!existingTx) {
          await prisma.salesTransaction.create({
            data: {
              sourceType: tx.sourceType,
              sourceFileName: tx.sourceFileName,
              storeName: tx.storeName,
              salesChannel: tx.salesChannel,
              date: tx.date,
              granularity: tx.granularity,
              variantId: variant.id,
              rawProductText: tx.rawProductText,
              quantity: tx.quantity,
              grossSales: tx.grossSales,
              netSales: tx.netSales
            }
          });
          successCount++;
        }
      } catch (err) {
        console.error('Error inserting tx:', err);
        failCount++;
      }
    }

    await prisma.importLog.create({
      data: {
        fileName: file.name,
        sourceType: transactions.length > 0 ? transactions[0].sourceType : 'unknown',
        status: failCount === 0 ? 'SUCCESS' : (successCount > 0 ? 'PARTIAL' : 'FAILED'),
        totalRows: transactions.length,
        failedRows: failCount
      }
    });

    return NextResponse.json({ success: true, inserted: successCount, failed: failCount });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
