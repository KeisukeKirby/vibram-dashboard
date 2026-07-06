import { parseProductString } from './utils.js';
import mappings from '../config/mappings.json';

export function parseOrderDetail(rows, fileName) {
  // Header is on row 2 (index 1)
  if (rows.length < 2) return [];

  const map = mappings.order_detail.channel_to_store;
  const transactions = [];

  // P: 15, Q: 16, AP: 41, AS: 44, AT: 45
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Sometimes rows are shorter than expected, pad or check length
    const rawChannel = String(row[15] || '').trim();
    if (!rawChannel) continue; // Skip empty rows

    const store = map[rawChannel] || rawChannel;
    
    // Q (Date) might be an excel serial or string. Let's assume standard JS Date parsing works or parse safely.
    // If it's a number, it's an excel serial date.
    let dateVal = row[16];
    let date = new Date();
    if (typeof dateVal === 'number') {
      date = new Date((dateVal - (25569)) * 86400 * 1000);
    } else if (dateVal) {
      date = new Date(dateVal);
    }

    const amount = parseFloat(String(row[41]).replace(/,/g, '')) || 0;
    const rawProduct = String(row[44] || '').trim();
    const quantity = parseInt(String(row[45]).replace(/,/g, ''), 10) || 0;

    if (!rawProduct) continue;

    const { baseProductName, color, size } = parseProductString(rawProduct, 'size_color');

    transactions.push({
      date,
      store,
      channel: rawChannel,
      product_name: baseProductName,
      size,
      color,
      quantity,
      amount,
      source_file: fileName,
      source_type: 'order_detail'
    });
  }

  return transactions;
}
