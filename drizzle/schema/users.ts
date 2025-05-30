import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  countryCode: text('country_code'),
  timezone: text('timezone').notNull().default('UTC'),
  language: text('language').notNull().default('en'),
  referralCode: text('referral_code'),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  roleId: uuid('role_id').notNull(),
  isAffiliate: boolean('is_affiliate').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 