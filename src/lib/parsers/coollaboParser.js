import * as xlsx from 'xlsx';
import { parseProductString } from './utils.js';
import mappings from '../config/mappings.json';

export function parseCoollabo(workbookOrRows, fileName) {
  const store = mappings.coollabo.fixed_store;
  const transactions = [];

  // It could be just rows if it was CSV, but let's assume it's a workbook
  let sheetsData = [];
  if (workbookOrRows.SheetNames) {
    const workbook = workbookOrRows;
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      sheetsData.push(rows);
    }
  } else {
    sheetsData.push(workbookOrRows); // fallback to rows
  }

  for (const rows of sheetsData) {
    // Find headers: รายการขาย, จำนวน, สุทธิ
    let headerIdx = -1;
    let prodCol = -1;
    let qtyCol = -1;
    let amtCol = -1;
    let dateCol = -1; // Sometimes dates are on the left

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!row) continue;
      
      const rowStr = row.map(c => String(c).trim()).join(',');
      if (rowStr.includes('รายการขาย') && rowStr.includes('จำนวน') && rowStr.includes('สุทธิ')) {
        headerIdx = i;
        const headers = row.map(h => String(h).trim());
        prodCol = headers.indexOf('รายการขาย');
        qtyCol = headers.indexOf('จำนวน');
        amtCol = headers.indexOf('สุทธิ');
        // Let's see if there's a date column in Thai like 'วันที่' or just English 'Date'
        dateCol = headers.findIndex(h => h.includes('วันที่') || h.toLowerCase().includes('date'));
        break;
      }
    }

    if (headerIdx === -1) continue; // Skip sheet if no headers

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawProduct = String(row[prodCol] || '').trim();
      
      // Skip empty or Grand Total rows
      if (!rawProduct || rawProduct.toLowerCase().includes('total') || rawProduct.includes('รวม')) {
        continue;
      }

      let date = new Date(); // fallback
      if (dateCol !== -1 && row[dateCol]) {
        let dateVal = row[dateCol];
        if (typeof dateVal === 'number') {
          date = new Date((dateVal - (25569)) * 86400 * 1000);
        } else {
          // If the date is empty or invalid, skip this row? Prompt said skip empty date rows.
          if (!dateVal.toString().trim()) continue;
          date = new Date(dateVal);
        }
      }

      const quantity = parseInt(String(row[qtyCol]).replace(/,/g, ''), 10) || 0;
      const amount = parseFloat(String(row[amtCol]).replace(/,/g, '')) || 0;

      // Note: Coollabo has (Color, Size) order
      const { baseProductName, color, size } = parseProductString(rawProduct, 'color_size');

      transactions.push({
        date,
        store,
        channel: null,
        product_name: baseProductName,
        size,
        color,
        quantity,
        amount,
        source_file: fileName,
        source_type: 'coollabo'
      });
    }
  }

  return transactions;
}
