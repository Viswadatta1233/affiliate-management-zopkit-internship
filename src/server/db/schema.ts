import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, varchar, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended']);
export const marketingAssetTypeEnum = pgEnum('marketing_asset_type', ['logo', 'banner', 'other']);

// Core Tables
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantName: varchar('tenant_name').notNull(),
  domain: varchar('domain').notNull().unique(),
  subdomain: varchar('subdomain').notNull().unique(),
  logoUrl: varchar('logo_url'),
  primaryColor: varchar('primary_color').default('#1A73E8'),
  secondaryColor: varchar('secondary_color').default('#34A853'),
  subscriptionTier: varchar('subscription_tier').default('free'),
  maxUsers: integer('max_users').default(5),
  status: tenantStatusEnum('status').default('trial'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull()
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roleName: varchar('role_name').notNull(),
  description: text('description'),
  isCustom: boolean('is_custom').default(false),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email').notNull().unique(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone'),
  countryCode: varchar('country_code'),
  timezone: varchar('timezone').default('UTC'),
  language: varchar('language').default('en'),
  referralCode: varchar('referral_code').unique(),
  termsAccepted: boolean('terms_accepted').default(false),
  marketingConsent: boolean('marketing_consent').default(false),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  isAffiliate: boolean('is_affiliate').default(false),
  password: varchar('password').notNull(),
  resetToken: text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Product Management
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  sku: varchar('sku').notNull(),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  category: varchar('category'),
  status: varchar('status', { length: 10 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Commission Management
export const commissionTiers = pgTable('commission_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tierName: varchar('tier_name').notNull(),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).notNull(),
  minSales: integer('min_sales').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const commissionRules = pgTable('commission_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  description: text('description'),
  type: varchar('type').notNull(),
  condition: varchar('condition').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  valueType: varchar('value_type').notNull(),
  status: varchar('status').notNull(),
  priority: integer('priority').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Affiliate Management (Enhanced from first schema)
export const affiliates = pgTable('affiliates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: text('referral_code').notNull(),
  currentTierId: uuid('current_tier_id').references(() => commissionTiers.id, { onDelete: 'set null' }),
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

export const affiliateInvites = pgTable('affiliate_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  status: varchar('status').default('pending'),
  token: varchar('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
});

export const affiliateDetails = pgTable('affiliate_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tenantName: varchar('tenant_name').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: varchar('referral_code'),
  currentTier: uuid('current_tier').references(() => commissionTiers.id, { onDelete: 'set null' }),
  websiteUrl: varchar('website_url'),
  socialMedia: jsonb('social_media'),
  promotionalMethods: jsonb('promotional_methods'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const affiliateProductCommissions = pgTable('affiliate_product_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id').references(() => users.id, { onDelete: 'set null' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  trackingLinkId: uuid('tracking_link_id').references(() => trackingLinks.id, { onDelete: 'set null' }),
  commissionTierId: uuid('commission_tier_id').notNull().references(() => commissionTiers.id, { onDelete: 'cascade' }),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).notNull(),
  productCommission: numeric('product_commission', { precision: 10, scale: 2 }).notNull(),
  finalCommission: numeric('final_commission', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tracking System
export const trackingLinks = pgTable('tracking_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  trackingCode: varchar('tracking_code').notNull().unique(),
  totalClicks: integer('total_clicks').default(0),
  totalConversions: integer('total_conversions').default(0),
  totalSales: numeric('total_sales', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trackingEvents = pgTable('tracking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  trackingLinkId: uuid('tracking_link_id').notNull().references(() => trackingLinks.id, { onDelete: 'cascade' }),
  type: varchar('type').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Campaign Management
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: text('status').notNull().default('draft'),
  type: text('type').notNull(),
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
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
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

// Analytics Tables
export const campaignClicks = pgTable('campaign_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  participationId: uuid('participation_id').notNull().references(() => campaignParticipations.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  linkId: text('link_id').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const campaignConversions = pgTable('campaign_conversions', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  participationId: uuid('participation_id').notNull().references(() => campaignParticipations.id, { onDelete: 'cascade' }),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
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
  roles: many(roles),
  products: many(products),
  affiliates: many(affiliates),
  campaigns: many(campaigns),
  affiliateInvites: many(affiliateInvites),
  commissionTiers: many(commissionTiers),
  commissionRules: many(commissionRules),
  trackingLinks: many(trackingLinks),
  trackingEvents: many(trackingEvents),
  affiliateProductCommissions: many(affiliateProductCommissions),
  affiliateDetails: many(affiliateDetails),
  marketingAssets: many(marketingAssets),
  marketingGuidelines: many(marketingGuidelines)
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id]
  }),
  users: many(users)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  }),
  affiliate: one(affiliates),
  affiliateDetails: many(affiliateDetails),
  trackingLinks: many(trackingLinks),
  trackingEvents: many(trackingEvents)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id]
  }),
  affiliateInvites: many(affiliateInvites),
  trackingLinks: many(trackingLinks),
  affiliateProductCommissions: many(affiliateProductCommissions)
}));

export const commissionTiersRelations = relations(commissionTiers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [commissionTiers.tenantId],
    references: [tenants.id]
  }),
  affiliates: many(affiliates),
  affiliateDetails: many(affiliateDetails),
  affiliateProductCommissions: many(affiliateProductCommissions)
}));

export const commissionRulesRelations = relations(commissionRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [commissionRules.tenantId],
    references: [tenants.id]
  })
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [affiliates.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id]
  }),
  currentTier: one(commissionTiers, {
    fields: [affiliates.currentTierId],
    references: [commissionTiers.id]
  }),
  parentAffiliate: one(affiliates, {
    fields: [affiliates.parentAffiliateId],
    references: [affiliates.id]
  }),
  childAffiliates: many(affiliates),
  campaignParticipations: many(campaignParticipations),
  campaignClicks: many(campaignClicks),
  campaignConversions: many(campaignConversions)
}));

export const affiliateInvitesRelations = relations(affiliateInvites, ({ one }) => ({
  tenant: one(tenants, {
    fields: [affiliateInvites.tenantId],
    references: [tenants.id]
  }),
  product: one(products, {
    fields: [affiliateInvites.productId],
    references: [products.id]
  })
}));

export const affiliateDetailsRelations = relations(affiliateDetails, ({ one }) => ({
  tenant: one(tenants, {
    fields: [affiliateDetails.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [affiliateDetails.userId],
    references: [users.id],
  }),
  tier: one(commissionTiers, {
    fields: [affiliateDetails.currentTier],
    references: [commissionTiers.id],
  })
}));

export const affiliateProductCommissionsRelations = relations(affiliateProductCommissions, ({ one }) => ({
  affiliate: one(users, {
    fields: [affiliateProductCommissions.affiliateId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [affiliateProductCommissions.productId],
    references: [products.id]
  }),
  tenant: one(tenants, {
    fields: [affiliateProductCommissions.tenantId],
    references: [tenants.id]
  }),
  trackingLink: one(trackingLinks, {
    fields: [affiliateProductCommissions.trackingLinkId],
    references: [trackingLinks.id]
  }),
  commissionTier: one(commissionTiers, {
    fields: [affiliateProductCommissions.commissionTierId],
    references: [commissionTiers.id]
  })
}));

export const trackingLinksRelations = relations(trackingLinks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [trackingLinks.tenantId],
    references: [tenants.id]
  }),
  affiliate: one(users, {
    fields: [trackingLinks.affiliateId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [trackingLinks.productId],
    references: [products.id]
  }),
  trackingEvents: many(trackingEvents),
  affiliateProductCommissions: many(affiliateProductCommissions)
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [trackingEvents.tenantId],
    references: [tenants.id]
  }),
  affiliate: one(users, {
    fields: [trackingEvents.affiliateId],
    references: [users.id]
  }),
  trackingLink: one(trackingLinks, {
    fields: [trackingEvents.trackingLinkId],
    references: [trackingLinks.id]
  })
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id]
  }),
  participations: many(campaignParticipations),
  clicks: many(campaignClicks),
  conversions: many(campaignConversions)
}));

export const campaignParticipationsRelations = relations(campaignParticipations, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignParticipations.campaignId],
    references: [campaigns.id]
  }),
  affiliate: one(affiliates, {
    fields: [campaignParticipations.affiliateId],
    references: [affiliates.id]
  }),
  tenant: one(tenants, {
    fields: [campaignParticipations.tenantId],
    references: [tenants.id]
  }),
  clicks: many(campaignClicks),
  conversions: many(campaignConversions)
}));

export const campaignClicksRelations = relations(campaignClicks, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignClicks.campaignId],
    references: [campaigns.id]
  }),
  participation: one(campaignParticipations, {
    fields: [campaignClicks.participationId],
    references: [campaignParticipations.id]
  }),
  affiliate: one(affiliates, {
    fields: [campaignClicks.affiliateId],
    references: [affiliates.id]
  }),
  tenant: one(tenants, {
    fields: [campaignClicks.tenantId],
    references: [tenants.id]
  })
}));

export const campaignConversionsRelations = relations(campaignConversions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignConversions.campaignId],
    references: [campaigns.id]
  }),
  participation: one(campaignParticipations, {
    fields: [campaignConversions.participationId],
    references: [campaignParticipations.id]
  }),
  affiliate: one(affiliates, {
    fields: [campaignConversions.affiliateId],
    references: [affiliates.id]
  }),
  tenant: one(tenants, {
    fields: [campaignConversions.tenantId],
    references: [tenants.id]
  })
}));

export const marketingAssetsRelations = relations(marketingAssets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [marketingAssets.tenantId],
    references: [tenants.id]
  })
}));

export const marketingGuidelinesRelations = relations(marketingGuidelines, ({ one }) => ({
  tenant: one(tenants, {
    fields: [marketingGuidelines.tenantId],
    references: [tenants.id]
  })
}));

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);

export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertCommissionTierSchema = createInsertSchema(commissionTiers);
export const selectCommissionTierSchema = createSelectSchema(commissionTiers);

export const insertCommissionRuleSchema = createInsertSchema(commissionRules);
export const selectCommissionRuleSchema = createSelectSchema(commissionRules);

export const insertAffiliateSchema = createInsertSchema(affiliates);
export const selectAffiliateSchema = createSelectSchema(affiliates);

export const insertAffiliateInviteSchema = createInsertSchema(affiliateInvites);
export const selectAffiliateInviteSchema = createSelectSchema(affiliateInvites);

export const insertAffiliateDetailsSchema = createInsertSchema(affiliateDetails);
export const selectAffiliateDetailsSchema = createSelectSchema(affiliateDetails);

export const insertTrackingLinkSchema = createInsertSchema(trackingLinks);
export const selectTrackingLinkSchema = createSelectSchema(trackingLinks);

export const insertTrackingEventSchema = createInsertSchema(trackingEvents);
export const selectTrackingEventSchema = createSelectSchema(trackingEvents);

export const insertCampaignSchema = createInsertSchema(campaigns);
export const selectCampaignSchema = createSelectSchema(campaigns);

export const insertParticipationSchema = createInsertSchema(campaignParticipations);
export const selectParticipationSchema = createSelectSchema(campaignParticipations);

export const insertMarketingAssetSchema = createInsertSchema(marketingAssets);
export const selectMarketingAssetSchema = createSelectSchema(marketingAssets);

export const insertMarketingGuidelineSchema = createInsertSchema(marketingGuidelines);
export const selectMarketingGuidelineSchema = createSelectSchema(marketingGuidelines);

// Types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type CommissionTier = typeof commissionTiers.$inferSelect;
export type NewCommissionTier = typeof commissionTiers.$inferInsert;

export type CommissionRule = typeof commissionRules.$inferSelect;
export type NewCommissionRule = typeof commissionRules.$inferInsert;

export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert;

export type AffiliateInvite = typeof affiliateInvites.$inferSelect;
export type NewAffiliateInvite = typeof affiliateInvites.$inferInsert;

export type AffiliateDetails = typeof affiliateDetails.$inferSelect;
export type NewAffiliateDetails = typeof affiliateDetails.$inferInsert;

export type AffiliateProductCommission = typeof affiliateProductCommissions.$inferSelect;
export type NewAffiliateProductCommission = typeof affiliateProductCommissions.$inferInsert;

export type TrackingLink = typeof trackingLinks.$inferSelect;
export type NewTrackingLink = typeof trackingLinks.$inferInsert;

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type NewTrackingEvent = typeof trackingEvents.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignParticipation = typeof campaignParticipations.$inferSelect;
export type NewCampaignParticipation = typeof campaignParticipations.$inferInsert;

export type CampaignClick = typeof campaignClicks.$inferSelect;
export type NewCampaignClick = typeof campaignClicks.$inferInsert;

export type CampaignConversion = typeof campaignConversions.$inferSelect;
export type NewCampaignConversion = typeof campaignConversions.$inferInsert;

export type MarketingAsset = typeof marketingAssets.$inferSelect;
export type NewMarketingAsset = typeof marketingAssets.$inferInsert;

export type MarketingGuideline = typeof marketingGuidelines.$inferSelect;
export type NewMarketingGuideline = typeof marketingGuidelines.$inferInsert;