import { parseOrderDetail } from './src/lib/parsers/orderDetailParser.js';
import { parseDailySale } from './src/lib/parsers/dailySaleParser.js';
import { parseCoollabo } from './src/lib/parsers/coollaboParser.js';
import { parseProductString } from './src/lib/parsers/utils.js';

console.log('--- TEST UTILS ---');
console.log(parseProductString('VFF V-Soul(W38, Black)', 'size_color'));
console.log(parseProductString('V-ALPHA(M40, LIME GREEN/BLACK)', 'size_color'));
console.log(parseProductString('V-SOUL (SV,W40)', 'color_size'));

console.log('\n--- TEST ORDER DETAIL ---');
const orderRows = [
  [], // row 0
  ['Orders', '...', 'Payments', '...', 'Product data'], // row 1 (header 1)
  ['#', 'Type', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', 'Shopee VFF', '2026-07-01', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '...', '1500', '...', '...', 'VFF V-Soul(W38, Black)', '2'], // row 2 (data)
];
console.log(parseOrderDetail(orderRows, 'order_detail_test.csv'));

console.log('\n--- TEST DAILY SALE ---');
const dailyRows = [
  ['Store Name', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'SKU Name', 'x', 'x', 'x', 'x', 'x', 'Sales Quantity', 'x', 'x', 'Total Net Sales (Sales Amount)', 'Date'], // row 0 (header)
  ['CENTRAL WORLD-CDS', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'V-ALPHA(M40, LIME GREEN/BLACK)', 'x', 'x', 'x', 'x', 'x', '5', 'x', 'x', '25000', '2026-07-02'], // row 1
];
console.log(parseDailySale(dailyRows, 'Daily Sale Information_test.csv'));

console.log('\n--- TEST COOLLABO ---');
const coolRows = [
  ['วันที่', 'รายการขาย', 'จำนวน', 'สุทธิ'],
  ['2026-07-03', 'V-SOUL (SV,W40)', '10', '45000'],
  ['', 'Grand Total', '10', '45000']
];
console.log(parseCoollabo(coolRows, 'Sales Record_Coollabo Shop_test.xlsx'));
