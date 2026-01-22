const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Get already executed migrations
    const { rows: executed } = await client.query('SELECT name FROM migrations');
    const executedNames = new Set(executed.map(r => r.name));

    // Run pending migrations
    for (const file of files) {
      if (!executedNames.has(file)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Completed: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Failed: ${file}`);
          throw err;
        }
      } else {
        console.log(`Skipping (already executed): ${file}`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
