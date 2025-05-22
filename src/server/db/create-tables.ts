import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'asdfvbnm1234',
  database: 'affiliate_db',
  port: 5432,
});

async function createTables() {
  console.log('Creating tables...');
  
  try {
    // Create enums
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE tenant_status AS ENUM('trial', 'active', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM('active', 'inactive', 'pending');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE product_status AS ENUM('available', 'unavailable', 'outofstock');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_name varchar NOT NULL,
        domain varchar NOT NULL UNIQUE,
        subdomain varchar NOT NULL UNIQUE,
        logo_url varchar,
        primary_color varchar DEFAULT '#1A73E8',
        secondary_color varchar DEFAULT '#34A853',
        subscription_tier varchar DEFAULT 'free',
        max_users integer DEFAULT 5,
        status tenant_status DEFAULT 'trial',
        settings jsonb DEFAULT '{}'::jsonb,
        created_at timestamp DEFAULT now() NOT NULL,
        expires_at timestamp NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        role_name varchar NOT NULL,
        description text,
        permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
        is_custom boolean DEFAULT false,
        created_by uuid,
        created_at timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email varchar NOT NULL UNIQUE,
        first_name varchar NOT NULL,
        last_name varchar NOT NULL,
        phone varchar,
        country_code varchar,
        timezone varchar DEFAULT 'UTC',
        language varchar DEFAULT 'en',
        referral_code varchar UNIQUE,
        terms_accepted boolean DEFAULT false,
        marketing_consent boolean DEFAULT false,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        is_affiliate boolean DEFAULT false,
        password varchar NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        description text,
        image_url varchar,
        price decimal(10, 2) NOT NULL,
        currency varchar DEFAULT 'USD' NOT NULL,
        category varchar,
        status product_status DEFAULT 'available' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Created tables:', result.rows.map(row => row.table_name));
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
}); 