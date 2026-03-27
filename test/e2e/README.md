# End-to-End Tests

This directory contains end-to-end tests for sql-mcp using real database engines via Docker.

## Structure

```
e2e/
├── docker-compose.yml       # Multi-database test environment
├── setup.sh                 # Database seeding script
├── seed-data/               # SQL seed files
│   ├── seed.sql
│   ├── seed-databases.sql
│   └── seed-mssql.sql
├── fixtures/                # Test connection configs
│   ├── test-connections.json
│   └── test-db-connections.json
├── create-test-db.ts        # In-memory SQLite test setup
├── demo-test-db.ts          # Interactive demo script
└── test-with-db.ts          # Integration test example
```

## Quick Start

### 1. Start Test Databases

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- MySQL (port 3306)
- MariaDB (port 3307)
- MSSQL (port 1433)

### 2. Wait for Health Checks

```bash
docker compose ps
```

All services should show "healthy" status (30-60 seconds).

### 3. Seed Test Data

```bash
./setup.sh
```

This creates sample tables with realistic data:
- 10 users
- 15 products
- 25 orders
- ~72 order items
- 30 reviews

### 4. Run Tests

```bash
cd ../..
npm run test:integration
```

## Connection Details

| Database   | Host      | Port | Database | User     | Password     |
|------------|-----------|------|----------|----------|--------------|
| PostgreSQL | localhost | 5432 | testdb   | testuser | testpass     |
| MySQL      | localhost | 3306 | testdb   | testuser | testpass     |
| MariaDB    | localhost | 3307 | testdb   | testuser | testpass     |
| MSSQL      | localhost | 1433 | master   | sa       | TestPass123! |

## Test Scripts

### create-test-db.ts

Creates an in-memory SQLite database with sample data. Useful for quick testing without Docker.

```bash
npm run build
node test/e2e/create-test-db.js
```

### demo-test-db.ts

Interactive demo showing various SQL queries on the test database.

```bash
npm run build
node test/e2e/demo-test-db.js
```

### test-with-db.ts

Example integration test with SQLite adapter.

```bash
npm run build
node test/e2e/test-with-db.js
```

## Cleanup

### Stop Databases

```bash
docker compose down
```

### Remove All Data

```bash
docker compose down -v
```

This removes all volumes and provides a fresh start.

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5432

# Change port in docker-compose.yml or stop conflicting service
```

### Database Not Healthy

```bash
# Check logs
docker compose logs postgres

# Restart specific service
docker compose restart postgres

# Force recreate
docker compose up -d --force-recreate postgres
```

### Out of Memory

Increase Docker memory allocation:
1. Open Docker Desktop
2. Settings → Resources → Memory
3. Set to 4GB or higher
4. Apply & Restart

## Seed Data Schema

See `../../../TESTING.md` for detailed schema and example queries.

## Additional Resources

- Main testing guide: `../../TESTING.md`
- Client setup guides: `../../docs/clients/`
- Troubleshooting: `../../TROUBLESHOOTING.md`
