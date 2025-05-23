import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { tenants, affiliateTiers } from './schema';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'asdfvbnm1234',
  database: process.env.DB_NAME || 'affiliate_db',
  port: Number(process.env.DB_PORT) || 5432,
});

const db = drizzle(pool);

async function seed() {
  try {
    // Create default tenant
    const [defaultTenant] = await db.insert(tenants).values({
      tenantName: 'Default Tenant',
      domain: 'default.example.com',
      subdomain: 'default',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();

    console.log('Created default tenant:', defaultTenant);

    // Create default affiliate tiers
    const defaultTiers = [
      {
        name: 'bronze',
        description: 'Entry level affiliate tier',
        commissionRate: 5,
        minimumSales: 0,
        benefits: ['Basic commission rates', 'Standard support'],
        tenantId: defaultTenant.id,
      },
      {
        name: 'silver',
        description: 'Mid-level affiliate tier',
        commissionRate: 10,
        minimumSales: 1000,
        benefits: ['Higher commission rates', 'Priority support', 'Monthly newsletter'],
        tenantId: defaultTenant.id,
      },
      {
        name: 'gold',
        description: 'Top-level affiliate tier',
        commissionRate: 15,
        minimumSales: 5000,
        benefits: ['Premium commission rates', 'VIP support', 'Early access to promotions', 'Custom marketing materials'],
        tenantId: defaultTenant.id,
      },
    ];

    const createdTiers = await db.insert(affiliateTiers).values(defaultTiers).returning();
    console.log('Created default affiliate tiers:', createdTiers);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed(); 