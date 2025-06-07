import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST||'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER||'postgres',
  password: process.env.DB_PASSWORD||'datta1234',
  database: process.env.DB_NAME||'affiliate_db',
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Log database config (without sensitive info)
console.log('Connecting to database with config:', {
  ...dbConfig,
  password: '****' // Hide password in logs
});

const pool = new Pool(dbConfig);

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await testConnection();
    console.log('Initial database connection successful');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export for migrations and cleanup
export { pool, initializeDatabase };