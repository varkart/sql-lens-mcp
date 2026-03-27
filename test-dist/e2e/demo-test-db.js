import { createTestDatabase } from './create-test-db.js';
/**
 * Interactive demo of the test database
 * Shows various query examples and database features
 */
function demoTestDatabase() {
    console.log('\n🎯 In-Memory SQLite Test Database Demo\n');
    console.log('='.repeat(50));
    const db = createTestDatabase();
    console.log('\n✅ Database created and seeded successfully!\n');
    // Show schema
    console.log('📋 Database Schema:');
    console.log('─'.repeat(50));
    const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `).all();
    tables.forEach((table) => {
        console.log(`\n📦 ${table.name.toUpperCase()}`);
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        columns.forEach((col) => {
            const pk = col.pk ? ' 🔑' : '';
            console.log(`   • ${col.name.padEnd(20)} ${col.type.padEnd(15)}${pk}`);
        });
    });
    // Example queries
    console.log('\n\n📊 Example Queries:');
    console.log('='.repeat(50));
    // 1. Complex JOIN query
    console.log('\n1️⃣  Top Selling Products (with order details):');
    const topProducts = db.prepare(`
    SELECT
      p.name,
      COUNT(DISTINCT o.id) as order_count,
      SUM(oi.quantity) as total_sold,
      ROUND(AVG(r.rating), 2) as avg_rating,
      ROUND(SUM(oi.quantity * oi.unit_price), 2) as revenue
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id
    ORDER BY revenue DESC
    LIMIT 5
  `).all();
    console.table(topProducts);
    // 2. Aggregate query
    console.log('\n2️⃣  User Statistics:');
    const userStats = db.prepare(`
    SELECT
      u.username,
      u.country,
      COUNT(DISTINCT o.id) as orders,
      COUNT(DISTINCT r.id) as reviews,
      ROUND(SUM(o.total_amount), 2) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN reviews r ON u.id = r.user_id
    WHERE u.is_active = 1
    GROUP BY u.id
    ORDER BY total_spent DESC
    LIMIT 5
  `).all();
    console.table(userStats);
    // 3. Subquery example
    console.log('\n3️⃣  Products Above Average Price:');
    const aboveAvg = db.prepare(`
    SELECT
      name,
      category,
      ROUND(price, 2) as price,
      stock_quantity
    FROM products
    WHERE price > (SELECT AVG(price) FROM products)
    ORDER BY price DESC
    LIMIT 5
  `).all();
    console.table(aboveAvg);
    // 4. Date-based query
    console.log('\n4️⃣  Recent Orders (by status):');
    const recentOrders = db.prepare(`
    SELECT
      o.id,
      u.username,
      o.status,
      ROUND(o.total_amount, 2) as amount,
      o.order_date
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.order_date DESC
    LIMIT 8
  `).all();
    console.table(recentOrders);
    // 5. Window function example (if supported)
    console.log('\n5️⃣  Product Rankings by Category:');
    const rankings = db.prepare(`
    SELECT
      name,
      category,
      ROUND(price, 2) as price,
      stock_quantity,
      RANK() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
    FROM products
    ORDER BY category, price_rank
    LIMIT 10
  `).all();
    console.table(rankings);
    // Database statistics
    console.log('\n\n📈 Database Statistics:');
    console.log('─'.repeat(50));
    const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get(),
        activeUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get(),
        totalProducts: db.prepare('SELECT COUNT(*) as count FROM products').get(),
        totalOrders: db.prepare('SELECT COUNT(*) as count FROM orders').get(),
        totalRevenue: db.prepare('SELECT ROUND(SUM(total_amount), 2) as total FROM orders').get(),
        avgOrderValue: db.prepare('SELECT ROUND(AVG(total_amount), 2) as avg FROM orders').get(),
        totalReviews: db.prepare('SELECT COUNT(*) as count FROM reviews').get(),
        avgRating: db.prepare('SELECT ROUND(AVG(rating), 2) as avg FROM reviews').get()
    };
    console.log(`Total Users:          ${stats.totalUsers.count}`);
    console.log(`Active Users:         ${stats.activeUsers.count}`);
    console.log(`Total Products:       ${stats.totalProducts.count}`);
    console.log(`Total Orders:         ${stats.totalOrders.count}`);
    console.log(`Total Revenue:        $${stats.totalRevenue.total}`);
    console.log(`Avg Order Value:      $${stats.avgOrderValue.avg}`);
    console.log(`Total Reviews:        ${stats.totalReviews.count}`);
    console.log(`Average Rating:       ${stats.avgRating.avg}/5.0`);
    console.log('\n\n💡 Usage Tips:');
    console.log('─'.repeat(50));
    console.log('• The database is in-memory and will be lost when closed');
    console.log('• Perfect for testing SQL queries and MCP server');
    console.log('• Includes foreign keys and realistic relationships');
    console.log('• Contains ~150+ rows across 5 tables');
    console.log('• All data is randomly generated on each run\n');
    return db;
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const db = demoTestDatabase();
        console.log('\n✨ Demo completed!\n');
        db.close();
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}
export { demoTestDatabase };
//# sourceMappingURL=demo-test-db.js.map