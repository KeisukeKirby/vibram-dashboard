import { parseProductString } from './utils.js';
import mappings from '../config/mappings.json';

export function parseDailySale(rows, fileName) {
  // Header is on row 1 (index 0)
  if (rows.length < 1) return [];

  const map = mappings.daily_sale_information.store_mapping;
  const transactions = [];

  // A: 0, J: 9, P: 15, S: 18
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rawStore = String(row[0] || '').trim();
    if (!rawStore) continue;

    const store = map[rawStore] || 'Others';
    
    // We don't have a date column specified for Daily Sale!
    // The prompt only said "A: Store Name, J: SKU, S: Total Net Sales, P: Sales Qty"
    // Usually there is a date column in daily sales. Let's look for a date column dynamically, or default to current date.
    // If not specified, we'll try to find 'date' in headers.
    let date = new Date();
    const headers = rows[0].map(h => String(h).toLowerCase());
    const dateIdx = headers.findIndex(h => h.includes('date'));
    if (dateIdx !== -1 && row[dateIdx]) {
      let dateVal = row[dateIdx];
      if (typeof dateVal === 'number') {
        date = new Date((dateVal - (25569)) * 86400 * 1000);
      } else {
        date = new Date(dateVal);
      }
    }

    const rawProduct = String(row[9] || '').trim();
    const quantity = parseInt(String(row[15]).replace(/,/g, ''), 10) || 0;
    const amount = parseFloat(String(row[18]).replace(/,/g, '')) || 0;

    if (!rawProduct) continue;

    const { baseProductName, color, size } = parseProductString(rawProduct, 'size_color');

    transactions.push({
      date,
      store,
      channel: null, // No channel specified
      product_name: baseProductName,
      size,
      color,
      quantity,
      amount,
      source_file: fileName,
      source_type: 'daily_sale_information'
    });
  }

  return transactions;
}
