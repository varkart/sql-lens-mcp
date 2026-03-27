import Database from 'better-sqlite3';
/**
 * Creates an in-memory SQLite database with seeded test data
 */
export function createTestDatabase() {
    const db = new Database(':memory:');
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Create tables
    createTables(db);
    // Seed data
    seedData(db);
    return db;
}
function createTables(db) {
    // Users table
    db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      age INTEGER,
      country VARCHAR(50)
    )
  `);
    // Products table
    db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      category VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Orders table
    db.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      shipping_address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
    // Order items table
    db.exec(`
    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
    // Reviews table
    db.exec(`
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}
function seedData(db) {
    // Seed users
    const usernames = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack'];
    const countries = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'Brazil', 'India', 'China'];
    const insertUser = db.prepare(`
    INSERT INTO users (username, email, full_name, age, country, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        insertUser.run(username, `${username}@example.com`, `${username.charAt(0).toUpperCase() + username.slice(1)} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5]}`, 20 + Math.floor(Math.random() * 50), countries[i], Math.random() > 0.2 ? 1 : 0);
    }
    // Seed products
    const productNames = [
        'Laptop', 'Smartphone', 'Headphones', 'Keyboard', 'Mouse',
        'Monitor', 'Tablet', 'Webcam', 'Speaker', 'Router',
        'SSD Drive', 'RAM Module', 'Graphics Card', 'Microphone', 'USB Cable'
    ];
    const categories = ['Electronics', 'Computers', 'Accessories', 'Peripherals', 'Components'];
    const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, stock_quantity, category)
    VALUES (?, ?, ?, ?, ?)
  `);
    for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        insertProduct.run(name, `High-quality ${name.toLowerCase()} for all your needs`, (Math.random() * 1000 + 50).toFixed(2), Math.floor(Math.random() * 100), categories[i % categories.length]);
    }
    // Seed orders
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, total_amount, status, shipping_address)
    VALUES (?, ?, ?, ?)
  `);
    for (let i = 0; i < 25; i++) {
        const userId = Math.floor(Math.random() * 10) + 1;
        const totalAmount = (Math.random() * 1000 + 50).toFixed(2);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const address = `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 99999) + 10000}`;
        insertOrder.run(userId, totalAmount, status, address);
    }
    // Seed order items
    const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `);
    for (let orderId = 1; orderId <= 25; orderId++) {
        const numItems = Math.floor(Math.random() * 4) + 1;
        const usedProducts = new Set();
        for (let i = 0; i < numItems; i++) {
            let productId;
            do {
                productId = Math.floor(Math.random() * 15) + 1;
            } while (usedProducts.has(productId));
            usedProducts.add(productId);
            const quantity = Math.floor(Math.random() * 5) + 1;
            const unitPrice = (Math.random() * 1000 + 50).toFixed(2);
            insertOrderItem.run(orderId, productId, quantity, unitPrice);
        }
    }
    // Seed reviews
    const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `);
    const comments = [
        'Great product, highly recommend!',
        'Good value for money',
        'Not bad, but could be better',
        'Excellent quality',
        'Disappointed with this purchase',
        'Works as expected',
        'Amazing! Exceeded my expectations',
        'Terrible, would not buy again',
        'Pretty good overall',
        'Decent product for the price'
    ];
    for (let i = 0; i < 30; i++) {
        const productId = Math.floor(Math.random() * 15) + 1;
        const userId = Math.floor(Math.random() * 10) + 1;
        const rating = Math.floor(Math.random() * 5) + 1;
        const comment = comments[Math.floor(Math.random() * comments.length)];
        insertReview.run(productId, userId, rating, comment);
    }
}
// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const db = createTestDatabase();
    console.log('\n✅ In-memory SQLite database created and seeded!\n');
    // Show some stats
    const stats = [
        { table: 'users', count: db.prepare('SELECT COUNT(*) as count FROM users').get() },
        { table: 'products', count: db.prepare('SELECT COUNT(*) as count FROM products').get() },
        { table: 'orders', count: db.prepare('SELECT COUNT(*) as count FROM orders').get() },
        { table: 'order_items', count: db.prepare('SELECT COUNT(*) as count FROM order_items').get() },
        { table: 'reviews', count: db.prepare('SELECT COUNT(*) as count FROM reviews').get() }
    ];
    console.log('Database Statistics:');
    console.log('===================');
    stats.forEach(({ table, count }) => {
        console.log(`${table.padEnd(15)} : ${count.count} rows`);
    });
    console.log('\n📊 Sample Queries:\n');
    // Sample query 1: Top products by rating
    console.log('Top 5 Rated Products:');
    const topProducts = db.prepare(`
    SELECT p.name, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id
    ORDER BY avg_rating DESC
    LIMIT 5
  `).all();
    console.table(topProducts);
    // Sample query 2: User order summary
    console.log('\nUser Order Summary:');
    const userOrders = db.prepare(`
    SELECT u.username, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY total_spent DESC
    LIMIT 5
  `).all();
    console.table(userOrders);
    console.log('\n✨ Database is ready for testing!');
    console.log('📝 The database will persist as long as this process is running.\n');
    // Keep the process alive
    console.log('Press Ctrl+C to exit...\n');
    process.stdin.resume();
}
export default createTestDatabase;
//# sourceMappingURL=create-test-db.js.map