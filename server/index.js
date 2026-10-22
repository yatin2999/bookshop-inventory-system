import path from 'node:path';
import express from 'express';
import { createBook, listAuthors, listBooks, listCategories, listSuppliers, updateBook } from './books.js';
import { pool } from './db.js';
import { getReceipt, getSale, listReceipts, listSales, summary } from './records.js';
import { recordReceipt, recordSale } from './stock.js';
import { ApiError } from './validate.js';

const app = express();
app.use(express.json());

app.get('/api/books', async (req, res) => res.json(await listBooks(req.query)));
app.post('/api/books', async (req, res) => res.status(201).json(await createBook(req.body)));
app.patch('/api/books/:id', async (req, res) => res.json(await updateBook(req.params.id, req.body)));
app.get('/api/authors', async (req, res) => res.json(await listAuthors()));
app.get('/api/categories', async (req, res) => res.json(await listCategories()));
app.get('/api/suppliers', async (req, res) => res.json(await listSuppliers()));
app.post('/api/receipts', async (req, res) => res.status(201).json(await recordReceipt(req.body)));
app.get('/api/receipts', async (req, res) => res.json(await listReceipts()));
app.get('/api/receipts/:id', async (req, res) => res.json(await getReceipt(req.params.id)));
app.post('/api/sales', async (req, res) => res.status(201).json(await recordSale(req.body)));
app.get('/api/sales', async (req, res) => res.json(await listSales()));
app.get('/api/sales/:id', async (req, res) => res.json(await getSale(req.params.id)));
app.get('/api/summary', async (req, res) => res.json(await summary()));
app.use('/api', () => {
  throw new ApiError(404, 'NOT_FOUND', 'Not found.');
});

app.use(express.static(path.join(import.meta.dirname, '..', 'client', 'dist')));

const MISSING_REFERENCES = {
  fk_books_category: 'Category not found.',
  fk_book_authors_author: 'Author not found.',
  fk_purchase_receipts_supplier: 'Supplier not found.',
};

function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }
  if (error?.type === 'entity.parse.failed') {
    return new ApiError(400, 'INVALID', 'The request is not valid JSON.');
  }
  switch (error?.errno) {
    case 1062:
      return new ApiError(409, 'DUPLICATE', error.sqlMessage?.includes('uq_books_isbn')
        ? 'A book with this ISBN already exists.'
        : 'This record already exists.');
    case 1452: {
      const constraint = /CONSTRAINT `([^`]+)`/.exec(error.sqlMessage ?? '')?.[1];
      return new ApiError(404, 'NOT_FOUND', MISSING_REFERENCES[constraint] ?? 'A referenced record does not exist.');
    }
    case 3819:
      return new ApiError(400, 'INVALID', 'A value is outside the allowed range.');
    case 1205:
    case 1213:
      return new ApiError(409, 'CONFLICT', 'Another request was using the same books. Nothing was saved; please try again.');
    default:
      break;
  }
  if (error?.fatal || ['ECONNREFUSED', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'].includes(error?.code)) {
    return new ApiError(503, 'DATABASE_UNAVAILABLE', 'The database is unavailable. Nothing was saved.');
  }
  return new ApiError(500, 'SERVER_ERROR', 'Something went wrong. Nothing was saved.');
}

app.use((error, req, res, next) => {
  const apiError = toApiError(error);
  if (apiError.status >= 500) {
    console.error(`${req.method} ${req.path}:`, error);
  }
  res.status(apiError.status).json({ error: { code: apiError.code, message: apiError.message, details: apiError.details } });
});

const port = Number(process.env.PORT || 3000);
try {
  const [[{ database }]] = await pool.query('SELECT DATABASE() AS `database`');
  if (!database) {
    throw new Error('DB_NAME is not set in .env');
  }
  app.listen(port, '127.0.0.1', () => {
    console.log(`Bookshop is running at http://127.0.0.1:${port} (database ${database})`);
  });
} catch (error) {
  console.error(`Cannot connect to MySQL: ${error.message}`);
  await pool.end();
  process.exitCode = 1;
}
