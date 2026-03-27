-- Seed script for SQL Server
-- Adjusted for SQL Server syntax

-- Create users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- Create products table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50),
        in_stock BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- Create orders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        order_date DATETIME DEFAULT GETDATE()
    );
END

-- Insert sample users
IF NOT EXISTS (SELECT * FROM users)
BEGIN
    INSERT INTO users (name, email) VALUES
        ('Alice Johnson', 'alice@example.com'),
        ('Bob Smith', 'bob@example.com'),
        ('Charlie Brown', 'charlie@example.com'),
        ('Diana Prince', 'diana@example.com'),
        ('Eve Wilson', 'eve@example.com');
END

-- Insert sample products
IF NOT EXISTS (SELECT * FROM products)
BEGIN
    INSERT INTO products (name, price, category, in_stock) VALUES
        ('Laptop Pro', 1299.99, 'Electronics', 1),
        ('Wireless Mouse', 29.99, 'Electronics', 1),
        ('Office Chair', 299.99, 'Furniture', 1),
        ('Desk Lamp', 49.99, 'Furniture', 1),
        ('Coffee Maker', 89.99, 'Appliances', 1),
        ('Notebook Set', 12.99, 'Stationery', 1),
        ('USB Hub', 24.99, 'Electronics', 0),
        ('Water Bottle', 19.99, 'Accessories', 1);
END

-- Insert sample orders
IF NOT EXISTS (SELECT * FROM orders)
BEGIN
    INSERT INTO orders (user_id, total_amount, status) VALUES
        (1, 1329.98, 'completed'),
        (2, 299.99, 'completed'),
        (3, 89.99, 'pending'),
        (1, 49.99, 'shipped'),
        (4, 1299.99, 'processing');
END
