import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { campaigns } from './campaigns';
import { affiliates } from './affiliates';
import { tenants } from './tenants';

export const campaignParticipations = pgTable('campaign_participations', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  affiliateId: uuid('affiliate_id').references(() => affiliates.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: text('status', { enum: ['pending', 'active', 'completed', 'rejected'] }).notNull(),
  metrics: jsonb('metrics').notNull().default({
    reach: 0,
    engagement: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  }),
  promotionalLinks: jsonb('promotional_links').notNull().default([]),
  promotionalCodes: jsonb('promotional_codes').notNull().default([]),
  promoCode: text('promo_code').notNull(),
  joinedAt: timestamp('joined_at').notNull().default(sql`now()`),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
}); 