import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { parseOrderDetail } from './orderDetailParser.js';
import { parseDailySale } from './dailySaleParser.js';
import { parseCoollabo } from './coollaboParser.js';

export async function processFile(fileBuffer, fileName, metadata = {}) {
  let workbook = null;
  let rows = [];
  
  if (fileName.endsWith('.csv')) {
    const text = fileBuffer.toString('utf-8');
    const result = Papa.parse(text, { skipEmptyLines: true });
    rows = result.data;
  } else if (fileName.endsWith('.xlsx')) {
    workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  } else {
    throw new Error('Unsupported file format');
  }

  // Route by filename prefix
  if (fileName.toLowerCase().startsWith('order_detail')) {
    return parseOrderDetail(rows, fileName);
  } else if (fileName.toLowerCase().startsWith('daily sale information')) {
    return parseDailySale(rows, fileName);
  } else if (fileName.toLowerCase().startsWith('sales record_coollabo shop')) {
    // Pass workbook to handle multiple sheets
    return parseCoollabo(workbook || rows, fileName);
  } else {
    throw new Error(`Unsupported file prefix: ${fileName}. Must start with 'order_detail', 'Daily Sale Information', or 'Sales Record_Coollabo Shop'.`);
  }
}
