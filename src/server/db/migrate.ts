import 'dotenv/config'; // Load environment variables from .env file
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '../../..');

// Get database connection details from environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'affiliate_db';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');

// Log connection details (without password)
console.log('Database connection:', {
  host: DB_HOST,
  user: DB_USER,
  database: DB_NAME,
  port: DB_PORT
});

const pool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
});

const db = drizzle(pool);

async function main() {
  console.log('Running migrations...');
  console.log('Project root:', projectRoot);
  console.log('Migrations folder:', join(projectRoot, 'drizzle/migrations'));
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();

    // Run migrations
    await migrate(db, {
      migrationsFolder: join(projectRoot, 'drizzle/migrations'),
    });
    
    console.log('Migrations completed successfully');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Created tables:', result.rows.map(row => row.table_name));
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});