# Bookshop Inventory & Sales Management System

Bookshop Inventory & Sales Management System is a MySQL-based application for managing books, recording stock received from suppliers, processing sales and viewing transaction records.

[Watch the demo](https://github.com/user-attachments/assets/d95e0bfe-c960-4dca-add4-6c6af75600cb)

## Features

- **Books:** the catalogue with authors, category, price and stock. Search by title or ISBN, add a book with one or more authors, or edit its title, category and price.
- **Receive:** record a delivery from a supplier, with a quantity and unit cost for each book. Stock rises when the receipt is recorded.
- **Checkout:** add books to a sale, see the estimated total and record the sale as an invoice.
- **Records:** recent invoices and receipts with their lines and prices, sales and purchase totals, and the top-selling books.

## Requirements

- [Node.js](https://nodejs.org/) 24.2 or later.
- [MySQL Server 8.4](https://dev.mysql.com/downloads/mysql/8.4.html) and its command-line client.

## Setup

These steps create a new, empty `bookshop` database with sample data.

1. From this folder, start the MySQL client with an account that can create databases, for example `mysql -u root -p`. On Windows the client is usually `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`.
2. At the `mysql>` prompt, create the database and load the schema and sample data. `SOURCE` reads the files relative to the folder the client was started from:

   ```sql
   CREATE DATABASE bookshop;
   USE bookshop;
   SOURCE db/schema.sql;
   SOURCE db/seed.sql;
   EXIT;
   ```

3. Copy `.env.example` to `.env` and set `DB_PASSWORD`, and `DB_USER` if you do not use `root`.

## Build and run

```powershell
npm install
npm run build
npm start
```

Then open <http://127.0.0.1:3000>.

## Demonstration

1. In **Books**, browse the catalogue and the stock of each book.
2. Choose **Add book** to add a book with its ISBN, category, price and authors.
3. In **Receive**, choose a supplier, add books with their quantities and unit costs, and record the receipt.
4. In **Checkout**, add books to a sale and record it.
5. In **Records**, open the saved receipt or invoice to see its lines and prices.

## Project files

- `client`: the React interface. `server`: the Express API and its SQL.
- `db`: `schema.sql`, `seed.sql` and `queries.sql` (example queries).
- [docs/DESIGN.md](docs/DESIGN.md): the database design. [ASSIGNMENT.md](ASSIGNMENT.md): the project brief.

## License

Released under the MIT License; see [LICENSE](LICENSE).
