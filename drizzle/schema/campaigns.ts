import { pgTable, text, timestamp, jsonb, uuid, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';
import { affiliates } from './affiliates';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: text('status').notNull().default('draft'),
  type: text('type').notNull(),
  requirements: jsonb('requirements').notNull().default({}),
  rewards: jsonb('rewards').notNull().default({}),
  content: jsonb('content').notNull().default({}),
  metrics: jsonb('metrics').notNull().default({
    totalReach: 0,
    engagementRate: 0,
    conversions: 0,
    revenue: 0
  }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export const campaignParticipations = pgTable('campaign_participations', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull().default('active'),
  metrics: jsonb('metrics').notNull().default({
    reach: 0,
    engagement: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  }),
  promotionalLinks: jsonb('promotional_links').notNull().default([]),
  promotionalCodes: jsonb('promotional_codes').notNull().default([]),
  joinedAt: timestamp('joined_at').notNull().default(sql`now()`),
  completedAt: timestamp('completed_at')
});

// Analytics tables for tracking campaign performance
export const campaignClicks = pgTable('campaign_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  participationId: uuid('participation_id').notNull().references(() => campaignParticipations.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  linkId: text('link_id').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const campaignConversions = pgTable('campaign_conversions', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  participationId: uuid('participation_id').notNull().references(() => campaignParticipations.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  orderId: text('order_id').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  promoCode: text('promo_code'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// Zod schemas for validation
export const insertCampaignSchema = createInsertSchema(campaigns);
export const selectCampaignSchema = createSelectSchema(campaigns);

export const insertParticipationSchema = createInsertSchema(campaignParticipations);
export const selectParticipationSchema = createSelectSchema(campaignParticipations);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignParticipation = typeof campaignParticipations.$inferSelect;
export type NewCampaignParticipation = typeof campaignParticipations.$inferInsert; 