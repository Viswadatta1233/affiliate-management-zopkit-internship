import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'datta1234',
  database: 'affiliate_db',
  port: 5432,
});

const db = drizzle(pool);

async function dropTables() {
  console.log('Dropping tables...');
  
  try {
    // Drop tables in correct order (respecting foreign key constraints)
    await pool.query(`
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS tenants CASCADE;
      DROP TYPE IF EXISTS user_status CASCADE;
      DROP TYPE IF EXISTS tenant_status CASCADE;
    `);
    
    console.log('Tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropTables().catch((err) => {
  console.error('Failed to drop tables:', err);
  process.exit(1);
}); 