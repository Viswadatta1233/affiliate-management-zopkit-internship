import { pgTable, uuid, varchar, timestamp, jsonb, boolean, text, integer, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended']);

// Tables
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
  permissions: jsonb('permissions').notNull().default([]),
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
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  sku: varchar('sku'),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }),
  status: varchar('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

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

// New tables for affiliate management
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

export const trackingLinks = pgTable('tracking_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Add tenant_id column (linked to tenants.id)
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }), // ✅ Corrected
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  trackingCode: varchar('tracking_code').notNull().unique(),
  totalClicks: integer('total_clicks').default(0),
  totalConversions: integer('total_conversions').default(0),
  totalSales: numeric('total_sales', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const affiliateProductCommissions = pgTable('affiliate_product_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id').references(() => users.id, { onDelete: 'set null' }), // initially null, set on accept
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  trackingLinkId: uuid('tracking_link_id').references(() => trackingLinks.id, { onDelete: 'set null' }), // initially null, set on accept
  commissionTierId: uuid('commission_tier_id').notNull().references(() => commissionTiers.id, { onDelete: 'cascade' }),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).notNull(),
  productCommission: numeric('product_commission', { precision: 10, scale: 2 }).notNull(),
  finalCommission: numeric('final_commission', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles)
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id]
  }),
  users: many(users)
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  })
}));