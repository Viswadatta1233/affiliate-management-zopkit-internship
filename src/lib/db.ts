import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../drizzle/schema';

// Get database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'affiliate_db',
  port: parseInt(process.env.DB_PORT || '5432', 10)
};

console.log('Connecting to database with config:', {
  ...dbConfig,
  password: '****' // Hide password in logs
});

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection immediately
pool.connect()
  .then(() => {
    console.log('Initial database connection successful');
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(-1);
  });

export const db = drizzle(pool, { schema }); 