import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a new pool instance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'datta1234',
  database: process.env.DB_NAME || 'affiliate_db',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for migrations
export { pool };