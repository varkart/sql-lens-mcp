-- Seed script for test databases
-- Run this against each database to populate with sample data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (name, email) VALUES
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Charlie Brown', 'charlie@example.com'),
    ('Diana Prince', 'diana@example.com'),
    ('Eve Wilson', 'eve@example.com');

-- Insert sample products
INSERT INTO products (name, price, category, in_stock) VALUES
    ('Laptop Pro', 1299.99, 'Electronics', true),
    ('Wireless Mouse', 29.99, 'Electronics', true),
    ('Office Chair', 299.99, 'Furniture', true),
    ('Desk Lamp', 49.99, 'Furniture', true),
    ('Coffee Maker', 89.99, 'Appliances', true),
    ('Notebook Set', 12.99, 'Stationery', true),
    ('USB Hub', 24.99, 'Electronics', false),
    ('Water Bottle', 19.99, 'Accessories', true);

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status) VALUES
    (1, 1329.98, 'completed'),
    (2, 299.99, 'completed'),
    (3, 89.99, 'pending'),
    (1, 49.99, 'shipped'),
    (4, 1299.99, 'processing');
