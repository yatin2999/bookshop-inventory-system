CREATE TABLE categories (
  category_id INT         NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60) NOT NULL,
  PRIMARY KEY (category_id),
  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT chk_categories_name CHECK (TRIM(name) <> '')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE authors (
  author_id INT          NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  PRIMARY KEY (author_id),
  CONSTRAINT chk_authors_full_name CHECK (TRIM(full_name) <> '')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE books (
  book_id     INT           NOT NULL AUTO_INCREMENT,
  isbn        CHAR(13)      NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  category_id INT           NOT NULL,
  list_price  DECIMAL(10,2) NOT NULL,
  qty_on_hand INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (book_id),
  CONSTRAINT uq_books_isbn UNIQUE (isbn),
  INDEX idx_books_category (category_id),
  CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories (category_id),
  CONSTRAINT chk_books_isbn CHECK (isbn REGEXP '^97[89][0-9]{10}$'),
  CONSTRAINT chk_books_title CHECK (TRIM(title) <> ''),
  CONSTRAINT chk_books_list_price CHECK (list_price > 0),
  CONSTRAINT chk_books_qty_on_hand CHECK (qty_on_hand >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE book_authors (
  book_id   INT NOT NULL,
  author_id INT NOT NULL,
  PRIMARY KEY (book_id, author_id),
  INDEX idx_book_authors_author (author_id),
  CONSTRAINT fk_book_authors_book FOREIGN KEY (book_id) REFERENCES books (book_id),
  CONSTRAINT fk_book_authors_author FOREIGN KEY (author_id) REFERENCES authors (author_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE suppliers (
  supplier_id INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  PRIMARY KEY (supplier_id),
  CONSTRAINT uq_suppliers_name UNIQUE (name),
  CONSTRAINT chk_suppliers_name CHECK (TRIM(name) <> '')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE purchase_receipts (
  receipt_id  INT  NOT NULL AUTO_INCREMENT,
  supplier_id INT  NOT NULL,
  received_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (receipt_id),
  INDEX idx_purchase_receipts_supplier (supplier_id),
  CONSTRAINT fk_purchase_receipts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE purchase_lines (
  receipt_id INT           NOT NULL,
  book_id    INT           NOT NULL,
  quantity   INT           NOT NULL,
  unit_cost  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (receipt_id, book_id),
  INDEX idx_purchase_lines_book (book_id),
  CONSTRAINT fk_purchase_lines_receipt FOREIGN KEY (receipt_id) REFERENCES purchase_receipts (receipt_id),
  CONSTRAINT fk_purchase_lines_book FOREIGN KEY (book_id) REFERENCES books (book_id),
  CONSTRAINT chk_purchase_lines_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_lines_unit_cost CHECK (unit_cost > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE sales (
  sale_id INT      NOT NULL AUTO_INCREMENT,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sale_id),
  INDEX idx_sales_sold_at (sold_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE sale_lines (
  sale_id    INT           NOT NULL,
  book_id    INT           NOT NULL,
  quantity   INT           NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (sale_id, book_id),
  INDEX idx_sale_lines_book (book_id),
  CONSTRAINT fk_sale_lines_sale FOREIGN KEY (sale_id) REFERENCES sales (sale_id),
  CONSTRAINT fk_sale_lines_book FOREIGN KEY (book_id) REFERENCES books (book_id),
  CONSTRAINT chk_sale_lines_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sale_lines_unit_price CHECK (unit_price > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE VIEW v_sale_totals AS
SELECT s.sale_id,
       s.sold_at,
       COUNT(sl.book_id) AS line_count,
       CAST(COALESCE(SUM(sl.quantity), 0) AS SIGNED) AS units,
       COALESCE(SUM(sl.quantity * sl.unit_price), 0) AS total
FROM sales s
LEFT JOIN sale_lines sl ON sl.sale_id = s.sale_id
GROUP BY s.sale_id, s.sold_at;

CREATE VIEW v_receipt_totals AS
SELECT r.receipt_id,
       r.received_on,
       r.supplier_id,
       sp.name AS supplier_name,
       COUNT(pl.book_id) AS line_count,
       CAST(COALESCE(SUM(pl.quantity), 0) AS SIGNED) AS units,
       COALESCE(SUM(pl.quantity * pl.unit_cost), 0) AS total
FROM purchase_receipts r
JOIN suppliers sp ON sp.supplier_id = r.supplier_id
LEFT JOIN purchase_lines pl ON pl.receipt_id = r.receipt_id
GROUP BY r.receipt_id, r.received_on, r.supplier_id, sp.name;
