import { createTestDatabase } from './create-test-db.js';
import { SQLiteAdapter } from './dist/connections/adapters/sqlite.js';
/**
 * Example: Using the test database with the SQLite adapter
 */
async function testWithDatabase() {
    console.log('🚀 Starting test database...\n');
    // Create in-memory database
    const db = createTestDatabase();
    // Create adapter configuration
    const config = {
        type: 'sqlite',
        database: ':memory:',
        readOnly: false
    };
    try {
        // Create and connect adapter
        const adapter = new SQLiteAdapter();
        // Pass the existing database instance
        adapter.db = db;
        console.log('✅ Database adapter ready!\n');
        // Example: Execute some test queries
        console.log('📊 Testing queries:\n');
        // Query 1: Get all users
        const users = db.prepare('SELECT * FROM users LIMIT 5').all();
        console.log('Sample Users:');
        console.table(users);
        // Query 2: Get products with low stock
        const lowStock = db.prepare(`
      SELECT name, stock_quantity, price
      FROM products
      WHERE stock_quantity < 50
      ORDER BY stock_quantity ASC
    `).all();
        console.log('\nLow Stock Products:');
        console.table(lowStock);
        // Query 3: Order statistics by status
        const orderStats = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      GROUP BY status
    `).all();
        console.log('\nOrder Statistics by Status:');
        console.table(orderStats);
        // Query 4: User with most reviews
        const topReviewers = db.prepare(`
      SELECT u.username, COUNT(r.id) as review_count
      FROM users u
      JOIN reviews r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY review_count DESC
      LIMIT 3
    `).all();
        console.log('\nTop Reviewers:');
        console.table(topReviewers);
        console.log('\n✨ Test database is working perfectly!');
        console.log('💡 You can now use this database for testing the MCP server.\n');
        return { db, adapter };
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testWithDatabase()
        .then(() => {
        console.log('✅ Test completed successfully!\n');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}
export { testWithDatabase };
//# sourceMappingURL=test-with-db.js.map