import { Pool } from 'pg';
import { dbConfig } from './index';

async function dropEnums() {
  const pool = new Pool(dbConfig);

  try {
    await pool.connect();
    console.log('Connected to database');

    // Drop the enum types
    await pool.query(`
      DROP TYPE IF EXISTS "public"."marketing_asset_type" CASCADE;
      DROP TYPE IF EXISTS "public"."tenant_status" CASCADE;
      DROP TYPE IF EXISTS "public"."user_status" CASCADE;
    `);

    console.log('Successfully dropped enum types');
  } catch (error) {
    console.error('Error dropping enum types:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropEnums().catch(console.error); 