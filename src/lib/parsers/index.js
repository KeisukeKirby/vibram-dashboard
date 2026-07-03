import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { parseProductString } from './regex-extractor.js';

export async function processFile(fileBuffer, fileName, metadata = {}) {
  let rows = [];
  
  if (fileName.endsWith('.csv')) {
    const text = fileBuffer.toString('utf-8');
    const result = Papa.parse(text, { skipEmptyLines: true });
    rows = result.data;
  } else if (fileName.endsWith('.xlsx')) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  } else {
    throw new Error('Unsupported file format');
  }

  if (rows.length === 0) {
    throw new Error('File is empty');
  }

  const sourceType = detectSourceType(rows);
  
  if (sourceType === 'pos_monthly') {
    return parsePosMonthly(rows, fileName);
  } else if (sourceType === 'ec_order') {
    return parseEcOrder(rows, fileName);
  } else if (sourceType === 'manual_sheet') {
    return parseManualSheet(rows, fileName, metadata);
  } else {
    throw new Error('Could not detect file format. Manual mapping required (not implemented yet).');
  }
}

function detectSourceType(rows) {
  const sample = rows.slice(0, 5).map(r => r.map(c => String(c).toLowerCase()).join(','));
  
  const sampleStr = sample.join('|');
  
  if (sampleStr.includes('store name') && sampleStr.includes('month sales date')) {
    return 'pos_monthly';
  }
  if (sampleStr.includes('sales channel') && sampleStr.includes('product code')) {
    return 'ec_order';
  }
  if (sampleStr.includes('商品名') || sampleStr.includes('ราคาเต็ม') || sampleStr.includes('สุทธิ')) {
    return 'manual_sheet';
  }
  
  return 'unknown';
}

function parsePosMonthly(rows, fileName) {
  const headers = rows[0].map(h => String(h).trim());
  const storeNameIdx = headers.findIndex(h => h.toLowerCase().includes('store name'));
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('month sales date'));
  const skuNameIdx = headers.findIndex(h => h.toLowerCase().includes('sku name'));
  const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('quantity'));
  const grossIdx = headers.findIndex(h => h.toLowerCase().includes('gross sales'));
  const netIdx = headers.findIndex(h => h.toLowerCase().includes('net sales'));
  const brandIdx = headers.findIndex(h => h.toLowerCase().includes('brand name'));
  const deptIdx = headers.findIndex(h => h.toLowerCase().includes('dept'));

  const transactions = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < Math.max(storeNameIdx, dateIdx, skuNameIdx)) continue;
    
    const skuName = String(row[skuNameIdx] || '');
    if (!skuName) continue;
    
    const { baseProductName, color, size } = parseProductString(skuName);
    
    // Simple date parsing for "Jun-2026"
    const dateStr = String(row[dateIdx] || '');
    let date = new Date();
    if (dateStr) {
       const [month, year] = dateStr.split('-');
       date = new Date(`${month} 1, ${year}`);
    }

    transactions.push({
      sourceType: 'pos_monthly',
      sourceFileName: fileName,
      storeName: String(row[storeNameIdx] || ''),
      salesChannel: 'POS',
      date,
      granularity: 'monthly',
      rawProductText: skuName,
      parsedProduct: { 
        baseProductName, 
        color, 
        size, 
        brand: row[brandIdx] || guessBrand(skuName), 
        category: row[deptIdx] || guessCategory(skuName) 
      },
      quantity: parseInt(String(row[qtyIdx]).replace(/,/g, ''), 10) || 0,
      grossSales: parseFloat(String(row[grossIdx]).replace(/,/g, '')) || 0,
      netSales: parseFloat(String(row[netIdx]).replace(/,/g, '')) || 0,
    });
  }
  return transactions;
}

function parseEcOrder(rows, fileName) {
  // EC has 2 header rows usually. Let's find the row that has 'product code'
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map(c => String(c).toLowerCase()).join(',');
    if (rowStr.includes('product code') && rowStr.includes('sales channel')) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rows[headerRowIdx].map(h => String(h).trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h === 'date');
  const channelIdx = headers.findIndex(h => h === 'sales channel');
  const prodCodeIdx = headers.findIndex(h => h === 'product code');
  const prodNameIdx = headers.findIndex(h => h === 'product name');
  const qtyIdx = headers.findIndex(h => h === 'quantity');
  const priceIdx = headers.findIndex(h => h.includes('unit price'));
  const totalIdx = headers.findIndex(h => h.includes('total amount') || h.includes('net'));

  const transactions = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const productCode = String(row[prodCodeIdx] || '');
    const productName = String(row[prodNameIdx] || '');
    if (!productCode && !productName) continue;
    
    const { baseProductName, color, size } = parseProductString(productCode || productName);
    
    transactions.push({
      sourceType: 'ec_order',
      sourceFileName: fileName,
      storeName: 'EC Warehouse', // default
      salesChannel: String(row[channelIdx] || 'EC'),
      date: new Date(row[dateIdx] || Date.now()),
      granularity: 'daily',
      rawProductText: productCode || productName,
      parsedProduct: { 
        baseProductName, 
        color, 
        size,
        brand: guessBrand(productCode || productName),
        category: guessCategory(productCode || productName)
      },
      quantity: parseInt(String(row[qtyIdx]).replace(/,/g, ''), 10) || 0,
      grossSales: parseFloat(String(row[priceIdx]).replace(/,/g, '')) * (parseInt(row[qtyIdx], 10) || 1) || 0,
      netSales: parseFloat(String(row[totalIdx]).replace(/,/g, '')) || 0,
    });
  }
  
  // Note: any PII columns are ignored because we only extract what we need.
  return transactions;
}

function guessCategory(productName) {
  const upper = (productName || '').toUpperCase();
  if (upper.includes('VFF') || upper.includes('V-') || upper.includes('KSO') || upper.includes('BIKILA') || upper.includes('TREK')) return 'VFF';
  if (upper.includes('FUROSHIKI')) return 'Furoshiki';
  if (upper.includes('SOCK') || upper.includes('ソックス')) return 'Accessories';
  return null;
}

function guessBrand(productName) {
  const upper = (productName || '').toUpperCase();
  if (upper.includes('VFF') || upper.includes('V-') || upper.includes('FUROSHIKI') || upper.includes('VIBRAM')) return 'Vibram';
  if (upper.includes('BFJ')) return 'BFJ';
  return null;
}

function parseManualSheet(rows, fileName, metadata) {
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map(c => String(c).toLowerCase()).join(',');
    if (rowStr.includes('date') || rowStr.includes('商品名')) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rows[headerRowIdx].map(h => String(h).trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const prodNameIdx = headers.findIndex(h => h.includes('商品名') || h.includes('product'));
  const qtyIdx = headers.findIndex(h => h.includes('数量') || h.includes('qty'));
  const grossIdx = headers.findIndex(h => h.includes('ราคาเต็ม') || h.includes('price'));
  const netIdx = headers.findIndex(h => h.includes('สุทธิ') || h.includes('net'));

  const transactions = [];
  const defaultStore = metadata.storeName || 'Manual Store';
  
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const productName = String(row[prodNameIdx] || '');
    if (!productName) continue;
    
    const { baseProductName, color, size } = parseProductString(productName);
    
    transactions.push({
      sourceType: 'manual_sheet',
      sourceFileName: fileName,
      storeName: defaultStore,
      salesChannel: 'Retail',
      date: new Date(row[dateIdx] || Date.now()),
      granularity: 'daily',
      rawProductText: productName,
      parsedProduct: { 
        baseProductName, 
        color, 
        size,
        brand: guessBrand(productName),
        category: guessCategory(productName)
      },
      quantity: parseInt(String(row[qtyIdx]).replace(/,/g, ''), 10) || 0,
      grossSales: parseFloat(String(row[grossIdx]).replace(/,/g, '')) || 0,
      netSales: parseFloat(String(row[netIdx]).replace(/,/g, '')) || 0,
    });
  }
  
  return transactions;
}
