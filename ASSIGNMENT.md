# Database Systems Project

## Bookshop Inventory & Sales Management System

Develop a local database application for a small neighbourhood bookshop. The shop keeps a catalogue of books, receives stock from suppliers, sells books to customers and keeps a record of what it bought and sold. A book can have several authors, a delivery can bring in several books, and a sale can include several books.

### Books and Stock

- Keep each book's ISBN, title, category, authors, selling price and available quantity.
- Search the catalogue by title or ISBN, add books with one or more authors, and edit a book's title, category and price.
- Record deliveries from suppliers, with a quantity and unit cost for each book, and increase the stock.

### Checkout and Records

- Complete a sale of one or more books, save it as an invoice and reduce the stock. A sale is refused if there is not enough stock.
- Keep the price charged and the cost paid on every line, so old invoices and receipts stay correct when prices change.
- Show recent invoices and receipts with their lines, sales and purchase totals, and the top-selling books.

### Expected Concepts

The project should demonstrate a sensible relational database in MySQL: an ER diagram, tables with primary and foreign keys, a many-to-many relationship between books and authors, and a design normalized to remove repeated information. It should use SQL joins, aggregation and views for its reports, and indexes on the columns it searches and joins. Receipts and sales should run as transactions, so that stock stays consistent and two sales cannot sell the same last copy.

### Testing and Submission

The application should run locally with a React interface, a Node.js and Express API, and MySQL. It should be demonstrated by adding a book, receiving stock, completing a sale and viewing the saved records. The submission should include:

- the source code;
- the SQL schema, sample data and example queries;
- instructions for setting up and running the application;
- short design documentation with the ER diagram.
