import { pgTable, uuid, varchar, timestamp, jsonb, boolean, text, integer, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended']);
export const productStatusEnum = pgEnum('product_status', ['available', 'unavailable', 'outofstock']);

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

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  description: text('description'),
  imageUrl: varchar('image_url'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  category: varchar('category'),
  status: productStatusEnum('status').default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  products: many(products)
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

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id]
  })
}));