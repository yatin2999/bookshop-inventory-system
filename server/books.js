import { pool, withTransaction } from './db.js';
import * as check from './validate.js';

const SELECT_BOOKS = `
  SELECT b.book_id AS bookId, b.isbn, b.title, b.category_id AS categoryId, c.name AS category,
         b.list_price AS price, b.qty_on_hand AS stock,
         GROUP_CONCAT(a.full_name ORDER BY a.full_name SEPARATOR ', ') AS authors
  FROM books b
  JOIN categories c ON c.category_id = b.category_id
  JOIN book_authors ba ON ba.book_id = b.book_id
  JOIN authors a ON a.author_id = ba.author_id`;
const GROUP_BOOKS = 'GROUP BY b.book_id, b.isbn, b.title, b.category_id, c.name, b.list_price, b.qty_on_hand';

export async function listBooks({ q }) {
  const search = typeof q === 'string' ? q.trim().slice(0, 100) : '';
  if (search === '') {
    const [rows] = await pool.query(`${SELECT_BOOKS} ${GROUP_BOOKS} ORDER BY b.title`);
    return rows;
  }
  const titlePattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  const [rows] = await pool.execute(
    `${SELECT_BOOKS} WHERE b.title LIKE ? OR b.isbn = ? ${GROUP_BOOKS} ORDER BY b.title`,
    [titlePattern, search.replace(/[\s-]/g, '')],
  );
  return rows;
}

async function getBook(bookId, db) {
  const [rows] = await db.execute(`${SELECT_BOOKS} WHERE b.book_id = ? ${GROUP_BOOKS}`, [bookId]);
  if (rows.length === 0) {
    throw check.notFound('Book not found.');
  }
  return rows[0];
}

function bookDetails(body) {
  return {
    title: check.text(body?.title, 'Title', 200),
    categoryId: check.id(body?.categoryId, 'Category'),
    price: check.amount(body?.price, 'Price'),
  };
}

export async function createBook(body) {
  const book = { ...bookDetails(body), isbn: check.isbn(body?.isbn), authorIds: check.idList(body?.authorIds, 'Authors') };
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      'INSERT INTO books (isbn, title, category_id, list_price) VALUES (?, ?, ?, ?)',
      [book.isbn, book.title, book.categoryId, book.price],
    );
    for (const authorId of book.authorIds) {
      await connection.execute('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', [result.insertId, authorId]);
    }
    return getBook(result.insertId, connection);
  });
}

export async function updateBook(idText, body) {
  const bookId = check.id(idText, 'Book');
  const book = bookDetails(body);
  return withTransaction(async (connection) => {
    await connection.execute(
      'UPDATE books SET title = ?, category_id = ?, list_price = ? WHERE book_id = ?',
      [book.title, book.categoryId, book.price, bookId],
    );
    return getBook(bookId, connection);
  });
}

export async function listAuthors() {
  const [rows] = await pool.query('SELECT author_id AS authorId, full_name AS name FROM authors ORDER BY full_name');
  return rows;
}

export async function listCategories() {
  const [rows] = await pool.query('SELECT category_id AS categoryId, name FROM categories ORDER BY name');
  return rows;
}

export async function listSuppliers() {
  const [rows] = await pool.query('SELECT supplier_id AS supplierId, name FROM suppliers ORDER BY name');
  return rows;
}
