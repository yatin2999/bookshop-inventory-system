import { pool } from './db.js';
import * as check from './validate.js';

const RECENT = 20;

const SALE_COLUMNS = 'sale_id AS saleId, sold_at AS soldAt, line_count AS lineCount, units, total';
const RECEIPT_COLUMNS = `receipt_id AS receiptId, received_on AS receivedOn, supplier_name AS supplier,
  line_count AS lineCount, units, total`;

export async function listSales() {
  const [rows] = await pool.query(
    `SELECT ${SALE_COLUMNS} FROM v_sale_totals ORDER BY sold_at DESC, sale_id DESC LIMIT ${RECENT}`,
  );
  return rows;
}

export async function getSale(idText, db = pool) {
  const saleId = check.id(idText, 'Invoice');
  const [[sale]] = await db.execute(`SELECT ${SALE_COLUMNS} FROM v_sale_totals WHERE sale_id = ?`, [saleId]);
  if (!sale) {
    throw check.notFound('Invoice not found.');
  }
  const [lines] = await db.execute(
    `SELECT sl.book_id AS bookId, b.title, b.isbn, sl.quantity, sl.unit_price AS unitPrice,
            sl.quantity * sl.unit_price AS lineTotal, b.list_price AS currentPrice
     FROM sale_lines sl
     JOIN books b ON b.book_id = sl.book_id
     WHERE sl.sale_id = ?
     ORDER BY b.title`,
    [saleId],
  );
  return { ...sale, lines };
}

export async function listReceipts() {
  const [rows] = await pool.query(
    `SELECT ${RECEIPT_COLUMNS} FROM v_receipt_totals ORDER BY received_on DESC, receipt_id DESC LIMIT ${RECENT}`,
  );
  return rows;
}

export async function getReceipt(idText, db = pool) {
  const receiptId = check.id(idText, 'Receipt');
  const [[receipt]] = await db.execute(`SELECT ${RECEIPT_COLUMNS} FROM v_receipt_totals WHERE receipt_id = ?`, [receiptId]);
  if (!receipt) {
    throw check.notFound('Receipt not found.');
  }
  const [lines] = await db.execute(
    `SELECT pl.book_id AS bookId, b.title, b.isbn, pl.quantity, pl.unit_cost AS unitCost,
            pl.quantity * pl.unit_cost AS lineTotal
     FROM purchase_lines pl
     JOIN books b ON b.book_id = pl.book_id
     WHERE pl.receipt_id = ?
     ORDER BY b.title`,
    [receiptId],
  );
  return { ...receipt, lines };
}

export async function summary() {
  const [[sales]] = await pool.query(
    `SELECT COUNT(*) AS invoices, CAST(COALESCE(SUM(units), 0) AS SIGNED) AS units,
            COALESCE(SUM(total), 0) AS revenue
     FROM v_sale_totals`,
  );
  const [[receipts]] = await pool.query(
    `SELECT COUNT(*) AS receipts, CAST(COALESCE(SUM(units), 0) AS SIGNED) AS units,
            COALESCE(SUM(total), 0) AS cost
     FROM v_receipt_totals`,
  );
  const [topSellers] = await pool.query(
    `SELECT b.book_id AS bookId, b.title, CAST(SUM(sl.quantity) AS SIGNED) AS units,
            SUM(sl.quantity * sl.unit_price) AS revenue
     FROM sale_lines sl
     JOIN books b ON b.book_id = sl.book_id
     GROUP BY b.book_id, b.title
     ORDER BY units DESC, revenue DESC, b.title
     LIMIT 5`,
  );
  return { sales, receipts, topSellers };
}
