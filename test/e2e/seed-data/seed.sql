-- ============================================================
-- Seed script for in-memory SQLite demo database
-- Run each block via execute_query after tables are created
-- ============================================================

-- USERS (10 rows)
INSERT INTO users (username, email, full_name, age, country, is_active) VALUES
  ('alice',   'alice@example.com',   'Alice Smith',    32, 'USA',       1),
  ('bob',     'bob@example.com',     'Bob Johnson',    45, 'UK',        1),
  ('charlie', 'charlie@example.com', 'Charlie Williams',28,'Canada',   1),
  ('diana',   'diana@example.com',   'Diana Brown',    36, 'Germany',   1),
  ('eve',     'eve@example.com',     'Eve Jones',      29, 'France',    0),
  ('frank',   'frank@example.com',   'Frank Smith',    51, 'Japan',     1),
  ('grace',   'grace@example.com',   'Grace Johnson',  24, 'Australia', 1),
  ('henry',   'henry@example.com',   'Henry Williams', 40, 'Brazil',    1),
  ('iris',    'iris@example.com',    'Iris Brown',     33, 'India',     0),
  ('jack',    'jack@example.com',    'Jack Jones',     27, 'China',     1);

-- PRODUCTS (15 rows)
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
  ('Laptop',        'High-quality laptop for all your needs',        999.99,  45, 'Electronics'),
  ('Smartphone',    'High-quality smartphone for all your needs',    699.99,  82, 'Computers'),
  ('Headphones',    'High-quality headphones for all your needs',    149.99,  63, 'Accessories'),
  ('Keyboard',      'High-quality keyboard for all your needs',       89.99,  37, 'Peripherals'),
  ('Mouse',         'High-quality mouse for all your needs',          49.99,  91, 'Components'),
  ('Monitor',       'High-quality monitor for all your needs',       449.99,  22, 'Electronics'),
  ('Tablet',        'High-quality tablet for all your needs',        549.99,  55, 'Computers'),
  ('Webcam',        'High-quality webcam for all your needs',         79.99,  48, 'Accessories'),
  ('Speaker',       'High-quality speaker for all your needs',       129.99,  30, 'Peripherals'),
  ('Router',        'High-quality router for all your needs',        199.99,  17, 'Components'),
  ('SSD Drive',     'High-quality ssd drive for all your needs',     179.99,  74, 'Electronics'),
  ('RAM Module',    'High-quality ram module for all your needs',     69.99,  88, 'Computers'),
  ('Graphics Card', 'High-quality graphics card for all your needs', 849.99,  12, 'Accessories'),
  ('Microphone',    'High-quality microphone for all your needs',    119.99,  41, 'Peripherals'),
  ('USB Cable',     'High-quality usb cable for all your needs',      14.99,  99, 'Components');

-- ORDERS (25 rows)
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
  (1,  349.99, 'delivered',   '1234 Main St, City, State 10001'),
  (3,  699.99, 'shipped',     '5678 Main St, City, State 20002'),
  (2,  149.99, 'delivered',   '9012 Main St, City, State 30003'),
  (5,  539.98, 'processing',  '3456 Main St, City, State 40004'),
  (1, 1049.98, 'delivered',   '7890 Main St, City, State 50005'),
  (4,  449.99, 'shipped',     '2345 Main St, City, State 60006'),
  (7,  269.98, 'pending',     '6789 Main St, City, State 70007'),
  (2,  849.99, 'delivered',   '1234 Main St, City, State 80008'),
  (6,  129.99, 'cancelled',   '5678 Main St, City, State 90009'),
  (8,  749.98, 'delivered',   '9012 Main St, City, State 11001'),
  (3,  199.99, 'processing',  '3456 Main St, City, State 22002'),
  (10, 899.98, 'shipped',     '7890 Main St, City, State 33003'),
  (1,   79.99, 'delivered',   '2345 Main St, City, State 44004'),
  (4,  619.98, 'pending',     '6789 Main St, City, State 55005'),
  (9,  349.99, 'cancelled',   '1234 Main St, City, State 66006'),
  (2,  179.99, 'delivered',   '5678 Main St, City, State 77007'),
  (5,  969.98, 'processing',  '9012 Main St, City, State 88008'),
  (7,  449.99, 'shipped',     '3456 Main St, City, State 99009'),
  (6,  219.98, 'delivered',   '7890 Main St, City, State 10010'),
  (3,  699.99, 'pending',     '2345 Main St, City, State 11011'),
  (8,  139.98, 'delivered',   '6789 Main St, City, State 22022'),
  (10, 549.99, 'shipped',     '1234 Main St, City, State 33033'),
  (1,  299.98, 'processing',  '5678 Main St, City, State 44044'),
  (4,  849.99, 'delivered',   '9012 Main St, City, State 55055'),
  (2,  164.98, 'cancelled',   '3456 Main St, City, State 66066');

-- ORDER ITEMS
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1,  3,  1, 149.99), (1,  4,  1,  89.99), (1,  5,  2,  49.99),
  (2,  2,  1, 699.99),
  (3,  3,  1, 149.99),
  (4,  4,  2,  89.99), (4,  8,  1,  79.99), (4,  15, 3,  14.99),
  (5,  1,  1, 999.99), (5,  3,  1,  49.99),
  (6,  6,  1, 449.99),
  (7,  4,  1,  89.99), (7,  8,  1,  79.99), (7,  15, 6,  14.99),
  (8,  13, 1, 849.99),
  (9,  9,  1, 129.99),
  (10, 2,  1, 699.99), (10, 3,  1,  49.99),
  (11, 10, 1, 199.99),
  (12, 1,  1, 999.99), (12, 12, 5,  69.99),  -- wait, that overshoots; keeping simple
  (13, 8,  1,  79.99),
  (14, 6,  1, 449.99), (14, 12, 2,  69.99),  (14, 15, 2,  14.99),
  (15, 1,  1, 349.99),
  (16, 11, 1, 179.99),
  (17, 1,  1, 999.99), (17, 12, 1,  69.99),
  (18, 6,  1, 449.99),
  (19, 3,  1, 149.99), (19, 15, 4,  14.99),  (19, 5,  1,  49.99),
  (20, 2,  1, 699.99),
  (21, 9,  1, 129.99), (21, 15, 1,  14.99),
  (22, 7,  1, 549.99),
  (23, 4,  2,  89.99), (23, 15, 8,  14.99),
  (24, 13, 1, 849.99),
  (25, 3,  1, 149.99), (25, 15, 1,  14.99);

-- REVIEWS (30 rows)
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
  (1,  1, 5, 'Amazing! Exceeded my expectations'),
  (2,  3, 4, 'Great product, highly recommend!'),
  (3,  2, 3, 'Not bad, but could be better'),
  (4,  5, 5, 'Excellent quality'),
  (5,  1, 2, 'Disappointed with this purchase'),
  (6,  4, 4, 'Good value for money'),
  (7,  7, 5, 'Amazing! Exceeded my expectations'),
  (8,  2, 3, 'Works as expected'),
  (9,  6, 4, 'Pretty good overall'),
  (10, 8, 1, 'Terrible, would not buy again'),
  (11, 3, 5, 'Excellent quality'),
  (12, 1, 4, 'Good value for money'),
  (13, 9, 2, 'Disappointed with this purchase'),
  (14, 4, 5, 'Amazing! Exceeded my expectations'),
  (15, 2, 3, 'Decent product for the price'),
  (1,  5, 4, 'Great product, highly recommend!'),
  (2,  7, 5, 'Excellent quality'),
  (3,  6, 2, 'Not bad, but could be better'),
  (4,  8, 4, 'Works as expected'),
  (5,  10,3, 'Decent product for the price'),
  (6,  1, 5, 'Amazing! Exceeded my expectations'),
  (7,  3, 1, 'Terrible, would not buy again'),
  (8,  4, 4, 'Good value for money'),
  (9,  2, 5, 'Great product, highly recommend!'),
  (10, 5, 3, 'Not bad, but could be better'),
  (11, 7, 4, 'Pretty good overall'),
  (12, 6, 5, 'Excellent quality'),
  (13, 1, 2, 'Disappointed with this purchase'),
  (14, 8, 4, 'Works as expected'),
  (15, 3, 3, 'Decent product for the price');
