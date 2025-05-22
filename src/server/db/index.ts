import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a new pool instance
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'datta1234', // Make sure this is a string
  database: 'affiliate_db',
  port: 5432,
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