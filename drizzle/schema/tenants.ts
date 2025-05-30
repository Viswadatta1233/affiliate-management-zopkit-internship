import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantName: text('tenant_name').notNull(),
  domain: text('domain').notNull(),
  subdomain: text('subdomain').notNull(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').notNull().default('#000000'),
  secondaryColor: text('secondary_color').notNull().default('#ffffff'),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  maxUsers: text('max_users').notNull().default('5'),
  status: text('status').notNull().default('active'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  expiresAt: timestamp('expires_at')
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert; 