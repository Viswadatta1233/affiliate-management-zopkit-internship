-- Create enums
CREATE TYPE "affiliate_status" AS ENUM ('pending', 'active', 'rejected', 'suspended');
CREATE TYPE "product_status" AS ENUM ('available', 'unavailable', 'outofstock');
CREATE TYPE "tenant_status" AS ENUM ('trial', 'active', 'suspended');
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'pending');

-- Create tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_name" varchar NOT NULL,
  "domain" varchar NOT NULL UNIQUE,
  "subdomain" varchar NOT NULL UNIQUE,
  "logo_url" varchar,
  "primary_color" varchar DEFAULT '#1A73E8',
  "secondary_color" varchar DEFAULT '#34A853',
  "subscription_tier" varchar DEFAULT 'free',
  "max_users" integer DEFAULT 5,
  "status" tenant_status DEFAULT 'trial',
  "settings" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL
);

-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "role_name" varchar NOT NULL,
  "description" text,
  "permissions" jsonb NOT NULL DEFAULT '[]',
  "is_custom" boolean DEFAULT false,
  "created_by" uuid,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "email" varchar NOT NULL UNIQUE,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "phone" varchar,
  "country_code" varchar,
  "timezone" varchar DEFAULT 'UTC',
  "language" varchar DEFAULT 'en',
  "referral_code" varchar UNIQUE,
  "terms_accepted" boolean DEFAULT false,
  "marketing_consent" boolean DEFAULT false,
  "role_id" uuid NOT NULL REFERENCES "roles" ("id") ON DELETE RESTRICT,
  "is_affiliate" boolean DEFAULT false,
  "password" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create affiliate_tiers table
CREATE TABLE IF NOT EXISTS "affiliate_tiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "description" text,
  "commission_rate" decimal(5,2) NOT NULL,
  "minimum_sales" decimal(10,2),
  "benefits" jsonb DEFAULT '[]',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "referral_code" varchar NOT NULL UNIQUE,
  "initial_tier_id" uuid REFERENCES "affiliate_tiers" ("id"),
  "parent_affiliate_id" uuid REFERENCES "affiliates" ("id"),
  "company_name" varchar,
  "website_url" varchar,
  "social_media" jsonb,
  "tax_id" varchar,
  "tax_form_type" varchar,
  "payment_threshold" decimal(10,2) NOT NULL DEFAULT 50,
  "preferred_currency" varchar(3) NOT NULL DEFAULT 'USD',
  "promotional_methods" jsonb DEFAULT '[]',
  "status" affiliate_status DEFAULT 'pending',
  "approved_by" uuid REFERENCES "users" ("id"),
  "approved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "description" text,
  "image_url" varchar,
  "price" decimal(10,2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "category" varchar,
  "status" product_status DEFAULT 'available',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
); 