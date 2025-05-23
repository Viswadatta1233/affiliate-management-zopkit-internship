import 'dotenv/config'; // Load environment variables from .env file
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { affiliateTiers } from './schema';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '../../..');

// Get database connection details from environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'asdfvbnm1234';
const DB_NAME = process.env.DB_NAME || 'affiliate_db';
const DB_PORT = Number(process.env.DB_PORT) || 5432;

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

async function createAffiliateTiersTable() {
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_tiers'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating affiliate_tiers table...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS affiliate_tiers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          name varchar NOT NULL,
          description text,
          commission_rate decimal(5,2) NOT NULL,
          minimum_sales decimal(10,2),
          benefits jsonb DEFAULT '[]',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now(),
          UNIQUE(tenant_id, name)
        );
      `);
      
      console.log('affiliate_tiers table created successfully');
    } else {
      // Add unique constraint if it doesn't exist
      try {
        await pool.query(`
          ALTER TABLE affiliate_tiers 
          ADD CONSTRAINT affiliate_tiers_tenant_id_name_key 
          UNIQUE (tenant_id, name);
        `);
        console.log('Added unique constraint to affiliate_tiers table');
      } catch (error) {
        // Ignore if constraint already exists
        if (error.code !== '42P07') {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error creating affiliate_tiers table:', error);
    throw error;
  }
}

async function insertDefaultTiers() {
  try {
    // Get default tenant
    const tenant = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (!tenant.rows.length) {
      console.log('No tenant found, skipping default tiers creation');
      return;
    }
    
    const tenantId = tenant.rows[0].id;
    
    // Insert default tiers
    const defaultTiers = [
      {
        name: 'bronze',
        description: 'Entry level affiliate tier',
        commission_rate: 5,
        minimum_sales: 0,
        benefits: ['Basic commission rates', 'Standard support'],
      },
      {
        name: 'silver',
        description: 'Mid-level affiliate tier',
        commission_rate: 10,
        minimum_sales: 1000,
        benefits: ['Higher commission rates', 'Priority support', 'Monthly newsletter'],
      },
      {
        name: 'gold',
        description: 'Top-level affiliate tier',
        commission_rate: 15,
        minimum_sales: 5000,
        benefits: ['Premium commission rates', 'VIP support', 'Early access to promotions', 'Custom marketing materials'],
      },
    ];
    
    for (const tier of defaultTiers) {
      // Use direct SQL to avoid type issues
      await pool.query(`
        INSERT INTO affiliate_tiers (tenant_id, name, description, commission_rate, minimum_sales, benefits)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id, name) DO NOTHING
      `, [
        tenantId,
        tier.name,
        tier.description,
        tier.commission_rate,
        tier.minimum_sales,
        JSON.stringify(tier.benefits)
      ]);
    }
    
    console.log('Default tiers created successfully');
  } catch (error) {
    console.error('Error creating default tiers:', error);
    throw error;
  }
}

async function main() {
  console.log('Running migrations...');
  console.log('Project root:', projectRoot);
  console.log('Migrations folder:', join(projectRoot, 'drizzle/migrations'));
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();

    // Create affiliate_tiers table
    await createAffiliateTiersTable();
    
    // Insert default tiers
    await insertDefaultTiers();
    
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
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();