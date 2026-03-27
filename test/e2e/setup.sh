#!/bin/bash
# Seed all test databases with sample data

set -e

echo "🌱 Seeding test databases..."

# Wait for databases to be healthy
echo "⏳ Waiting for databases to be ready..."
sleep 5

# PostgreSQL
echo "📊 Seeding PostgreSQL..."
docker exec -i sql-mcp-postgres psql -U testuser -d testdb < seed-databases.sql
echo "✅ PostgreSQL seeded"

# MySQL
echo "📊 Seeding MySQL..."
docker exec -i sql-mcp-mysql mysql -u testuser -ptestpass testdb < seed-databases.sql
echo "✅ MySQL seeded"

# MariaDB
echo "📊 Seeding MariaDB..."
docker exec -i sql-mcp-mariadb mariadb -u testuser -ptestpass testdb < seed-databases.sql
echo "✅ MariaDB seeded"

# SQL Server (requires different syntax)
echo "📊 Seeding SQL Server..."
# Wait for MSSQL to fully start (it's slower)
echo "⏳ Waiting for SQL Server to be ready..."
for i in {1..30}; do
    if docker exec sql-mcp-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "TestPass123!" -Q "SELECT 1" > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

docker exec -i sql-mcp-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "TestPass123!" -d master < seed-mssql.sql
echo "✅ SQL Server seeded"

echo ""
echo "🎉 All databases seeded successfully!"
echo ""
echo "📋 Test data available:"
echo "  - 5 users (Alice, Bob, Charlie, Diana, Eve)"
echo "  - 8 products (laptops, mice, furniture, etc.)"
echo "  - 5 orders with various statuses"
echo ""
echo "Try these queries:"
echo "  - SELECT * FROM users;"
echo "  - SELECT * FROM products WHERE in_stock = true;"
echo "  - SELECT * FROM orders WHERE status = 'completed';"
