import { pgTable, text, timestamp, jsonb, uuid, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  subdomain: text('subdomain').notNull(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  subscriptionTier: text('subscription_tier').default('free'),
  maxUsers: integer('max_users').default(5),
  status: text('status'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  expiresAt: timestamp('expires_at')
}); 