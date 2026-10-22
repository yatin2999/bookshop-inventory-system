import { withTransaction } from './db.js';
import { getReceipt, getSale } from './records.js';
import * as check from './validate.js';

async function lockBooks(connection, bookIds) {
  const books = new Map();
  for (const bookId of [...bookIds].sort((a, b) => a - b)) {
    const [rows] = await connection.execute(
      'SELECT book_id, title, list_price, qty_on_hand FROM books WHERE book_id = ? FOR UPDATE',
      [bookId],
    );
    if (rows.length === 0) {
      throw check.notFound(`Book ${bookId} not found.`);
    }
    books.set(bookId, rows[0]);
  }
  return books;
}

const placeholders = (count) => Array.from({ length: count }, () => '(?, ?, ?, ?)').join(', ');

export async function recordReceipt(body) {
  const supplierId = check.id(body?.supplierId, 'Supplier');
  const lines = check.lines(body?.lines, true);
  return withTransaction(async (connection) => {
    const [suppliers] = await connection.execute('SELECT supplier_id FROM suppliers WHERE supplier_id = ?', [supplierId]);
    if (suppliers.length === 0) {
      throw check.notFound('Supplier not found.');
    }
    await lockBooks(connection, lines.map((line) => line.bookId));
    const [header] = await connection.execute('INSERT INTO purchase_receipts (supplier_id) VALUES (?)', [supplierId]);
    await connection.execute(
      `INSERT INTO purchase_lines (receipt_id, book_id, quantity, unit_cost) VALUES ${placeholders(lines.length)}`,
      lines.flatMap((line) => [header.insertId, line.bookId, line.quantity, line.unitCost]),
    );
    for (const line of lines) {
      await connection.execute('UPDATE books SET qty_on_hand = qty_on_hand + ? WHERE book_id = ?', [line.quantity, line.bookId]);
    }
    return getReceipt(header.insertId, connection);
  });
}

export async function recordSale(body) {
  const lines = check.lines(body?.lines, false);
  return withTransaction(async (connection) => {
    const books = await lockBooks(connection, lines.map((line) => line.bookId));
    const short = lines
      .filter((line) => books.get(line.bookId).qty_on_hand < line.quantity)
      .map((line) => {
        const book = books.get(line.bookId);
        return { bookId: line.bookId, title: book.title, requested: line.quantity, available: book.qty_on_hand };
      });
    if (short.length > 0) {
      throw new check.ApiError(409, 'INSUFFICIENT_STOCK', 'Not enough stock. Nothing was sold.', { lines: short });
    }
    const [header] = await connection.execute('INSERT INTO sales () VALUES ()');
    await connection.execute(
      `INSERT INTO sale_lines (sale_id, book_id, quantity, unit_price) VALUES ${placeholders(lines.length)}`,
      lines.flatMap((line) => [header.insertId, line.bookId, line.quantity, books.get(line.bookId).list_price]),
    );
    for (const line of lines) {
      await connection.execute('UPDATE books SET qty_on_hand = qty_on_hand - ? WHERE book_id = ?', [line.quantity, line.bookId]);
    }
    return getSale(header.insertId, connection);
  });
}
