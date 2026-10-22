-- 1. Join: the catalogue with category and authors
SELECT b.book_id, b.title, c.name AS category, b.list_price, b.qty_on_hand,
       GROUP_CONCAT(a.full_name ORDER BY a.full_name SEPARATOR ', ') AS authors
FROM books b
JOIN categories c ON c.category_id = b.category_id
JOIN book_authors ba ON ba.book_id = b.book_id
JOIN authors a ON a.author_id = ba.author_id
GROUP BY b.book_id, b.title, c.name, b.list_price, b.qty_on_hand
ORDER BY b.title;

-- 2. Aggregation: revenue and copies sold per category
SELECT c.name AS category, SUM(sl.quantity) AS copies_sold, SUM(sl.quantity * sl.unit_price) AS revenue
FROM sale_lines sl
JOIN books b ON b.book_id = sl.book_id
JOIN categories c ON c.category_id = b.category_id
GROUP BY c.category_id, c.name
ORDER BY revenue DESC;

-- 3. HAVING: books that sold more than five copies
SELECT b.book_id, b.title, SUM(sl.quantity) AS copies_sold
FROM books b
JOIN sale_lines sl ON sl.book_id = b.book_id
GROUP BY b.book_id, b.title
HAVING SUM(sl.quantity) > 5
ORDER BY copies_sold DESC, b.title;

-- 4. Subquery: books that have never been sold
SELECT b.book_id, b.title, b.qty_on_hand
FROM books b
WHERE NOT EXISTS (SELECT 1 FROM sale_lines sl WHERE sl.book_id = b.book_id)
ORDER BY b.title;

-- 5. Views: the latest invoices and total spending per supplier
SELECT sale_id, sold_at, line_count, units, total
FROM v_sale_totals
ORDER BY sold_at DESC, sale_id DESC
LIMIT 5;

SELECT supplier_name, COUNT(*) AS receipts, SUM(total) AS spent
FROM v_receipt_totals
GROUP BY supplier_id, supplier_name
ORDER BY spent DESC;

-- 6. Indexes: an ISBN lookup, and August revenue written two ways
EXPLAIN SELECT book_id, title FROM books WHERE isbn = '9789999900096';

EXPLAIN SELECT COUNT(*) AS sale_lines, SUM(sl.quantity * sl.unit_price) AS revenue
FROM sales s
JOIN sale_lines sl ON sl.sale_id = s.sale_id
WHERE s.sold_at >= '2026-08-01' AND s.sold_at < '2026-09-01';

EXPLAIN SELECT COUNT(*) AS sale_lines, SUM(sl.quantity * sl.unit_price) AS revenue
FROM sales s
JOIN sale_lines sl ON sl.sale_id = s.sale_id
WHERE DATE(s.sold_at) BETWEEN '2026-08-01' AND '2026-08-31';

-- 7. Reconciliation: stored stock against units received minus units sold
SELECT b.book_id, b.title, b.qty_on_hand,
       COALESCE(r.received, 0) - COALESCE(s.sold, 0) AS expected
FROM books b
LEFT JOIN (SELECT book_id, SUM(quantity) AS received FROM purchase_lines GROUP BY book_id) r ON r.book_id = b.book_id
LEFT JOIN (SELECT book_id, SUM(quantity) AS sold FROM sale_lines GROUP BY book_id) s ON s.book_id = b.book_id
WHERE b.qty_on_hand <> COALESCE(r.received, 0) - COALESCE(s.sold, 0);

-- 8. Monthly sales: copies sold and revenue by month
SELECT DATE_FORMAT(s.sold_at, '%Y-%m') AS month,
       SUM(sl.quantity) AS copies_sold,
       SUM(sl.quantity * sl.unit_price) AS revenue
FROM sales s
JOIN sale_lines sl ON sl.sale_id = s.sale_id
GROUP BY DATE_FORMAT(s.sold_at, '%Y-%m')
ORDER BY month;

-- 9. Out-of-stock books: titles with no copies available
SELECT b.book_id, b.title, b.isbn
FROM books b
WHERE b.qty_on_hand = 0
ORDER BY b.title, b.book_id;
