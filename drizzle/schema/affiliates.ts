import { pgTable, text, timestamp, jsonb, uuid, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

export const affiliates = pgTable('affiliates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  referralCode: text('referral_code').notNull(),
  currentTierId: uuid('current_tier_id'),
  parentAffiliateId: uuid('parent_affiliate_id').references(() => affiliates.id),
  companyName: text('company_name').notNull(),
  websiteUrl: text('website_url').notNull(),
  socialMedia: jsonb('social_media').notNull().default({}),
  taxId: text('tax_id'),
  taxFormType: text('tax_form_type'),
  paymentThreshold: integer('payment_threshold').notNull().default(100),
  preferredCurrency: text('preferred_currency').notNull().default('USD'),
  promotionalMethods: jsonb('promotional_methods').notNull().default([]),
  metrics: jsonb('metrics').notNull().default({
    followers: 0,
    reach: 0,
    engagement: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  }),
  status: text('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert; 