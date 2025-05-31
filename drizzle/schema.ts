import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, varchar, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended']);
export const marketingAssetTypeEnum = pgEnum('marketing_asset_type', ['logo', 'banner', 'other']);

// Tenants
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
  status: tenantStatusEnum('status').default('trial'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at')
});

// Users
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Affiliates
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Campaigns
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
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
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
});

// Analytics tables
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
  createdAt: timestamp('created_at').notNull().defaultNow()
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
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Marketing Resources
export const marketingAssets = pgTable('marketing_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: marketingAssetTypeEnum('type').notNull(),
  url: text('url').notNull(),
  publicId: varchar('public_id').notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

export const marketingGuidelines = pgTable('marketing_guidelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  affiliates: many(affiliates),
  campaigns: many(campaigns)
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  })
}));

export const affiliatesRelations = relations(affiliates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [affiliates.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id]
  })
}));

// Zod schemas for validation
export const insertCampaignSchema = createInsertSchema(campaigns);
export const selectCampaignSchema = createSelectSchema(campaigns);
export const insertParticipationSchema = createInsertSchema(campaignParticipations);
export const selectParticipationSchema = createSelectSchema(campaignParticipations);

// Types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignParticipation = typeof campaignParticipations.$inferSelect;
export type NewCampaignParticipation = typeof campaignParticipations.$inferInsert; 