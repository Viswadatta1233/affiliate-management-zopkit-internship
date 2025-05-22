/*
  # Initial Database Schema for Affiliate Management Platform

  1. New Tables
    - `tenants`: Main tenant table for multi-tenancy
    - `users`: User accounts with authentication integration
    - `roles`: Role definitions for permission management
    - `affiliates`: Affiliate profiles
    - `tracking_links`: Affiliate tracking links
    - `commission_tiers`: Commission tier configurations
    - `product_commissions`: Product-specific commission rates
    - `sales`: Sales tracking from affiliate referrals
    - `commission_distributions`: Multi-tier commission distributions
    
  2. Security
    - Enable RLS on all tables
    - Add tenant isolation policies
    - Create authentication-based policies
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  subdomain VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3667CE',
  secondary_color VARCHAR(7) DEFAULT '#36A490',
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_affiliates INTEGER NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT tenants_subdomain_key UNIQUE (subdomain)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  country_code CHAR(2) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  referral_code VARCHAR(50),
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  role_id UUID NOT NULL,
  is_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_tenant_key UNIQUE (email, tenant_id)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_name VARCHAR(50) NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_custom BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roles_name_tenant_key UNIQUE (role_name, tenant_id)
);

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  referral_code VARCHAR(50) NOT NULL,
  current_tier_id UUID,
  parent_affiliate_id UUID REFERENCES affiliates(id),
  company_name VARCHAR(255),
  website_url VARCHAR(255),
  social_media JSONB DEFAULT '{}'::jsonb,
  tax_id VARCHAR(50),
  tax_form_type VARCHAR(20),
  payment_threshold DECIMAL(10,2) NOT NULL DEFAULT 50.0,
  preferred_currency CHAR(3) NOT NULL DEFAULT 'USD',
  promotional_methods TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  CONSTRAINT affiliates_referral_code_tenant_key UNIQUE (referral_code, tenant_id),
  CONSTRAINT affiliates_user_tenant_key UNIQUE (user_id, tenant_id)
);

-- Tracking Links table
CREATE TABLE IF NOT EXISTS tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  destination_url TEXT NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  utm_source VARCHAR(100) NOT NULL,
  utm_medium VARCHAR(100) NOT NULL,
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  short_code VARCHAR(20) NOT NULL,
  qr_code_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tracking_links_short_code_tenant_key UNIQUE (short_code, tenant_id)
);

-- Commission Tiers table
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tier_name VARCHAR(100) NOT NULL,
  tier_level INTEGER NOT NULL,
  base_commission_rate DECIMAL(5,2) NOT NULL,
  rollover_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  min_monthly_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_active_referrals INTEGER NOT NULL DEFAULT 0,
  bonus_threshold DECIMAL(10,2),
  bonus_amount DECIMAL(10,2),
  recurring_commission BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_duration INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  CONSTRAINT commission_tiers_level_tenant_key UNIQUE (tier_level, tenant_id)
);

-- Product Commission Rates table
CREATE TABLE IF NOT EXISTS product_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category_id VARCHAR(100),
  commission_type VARCHAR(20) NOT NULL,
  commission_value DECIMAL(10,2) NOT NULL,
  tier_overrides JSONB DEFAULT '{}'::jsonb,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  CONSTRAINT product_commissions_product_tenant_key UNIQUE (product_id, tenant_id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id VARCHAR(255) NOT NULL,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  customer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  sale_amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  ip_address INET,
  device_info JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT sales_order_tenant_key UNIQUE (order_id, tenant_id)
);

-- Commission Distribution table
CREATE TABLE IF NOT EXISTS commission_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sale_id UUID NOT NULL REFERENCES sales(id),
  beneficiary_id UUID NOT NULL REFERENCES affiliates(id),
  tier_level INTEGER NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  method_name VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  webhook_secret VARCHAR(255),
  supported_currencies CHAR(3)[] NOT NULL,
  min_payout DECIMAL(10,2) NOT NULL,
  max_payout DECIMAL(10,2) NOT NULL,
  fee_structure JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  batch_id UUID,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  reference_number VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES users(id),
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0
);

-- Default roles seeding
DO $$
BEGIN
  -- Add a foreign key from users to roles after both tables exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id);
  END IF;
END $$;

-- Foreign key from affiliates to commission_tiers
DO $$
BEGIN
  -- Add foreign key if the tables exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'affiliates_current_tier_id_fkey'
  ) THEN
    ALTER TABLE affiliates ADD CONSTRAINT affiliates_current_tier_id_fkey 
    FOREIGN KEY (current_tier_id) REFERENCES commission_tiers(id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tenant policies
CREATE POLICY "Tenants are viewable by authenticated users" 
  ON tenants 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Users policies
CREATE POLICY "Users can view other users in same tenant" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own data" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid());

-- Roles policies
CREATE POLICY "Roles are viewable by users in same tenant" 
  ON roles 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Affiliate policies
CREATE POLICY "Affiliates are viewable by users in same tenant" 
  ON affiliates 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Affiliates can update their own profile" 
  ON affiliates 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Tracking Links policies
CREATE POLICY "Tracking links are viewable by users in same tenant" 
  ON tracking_links 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Affiliates can manage their own tracking links" 
  ON tracking_links 
  FOR ALL
  TO authenticated 
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Commission Tiers policies
CREATE POLICY "Commission tiers are viewable by users in same tenant" 
  ON commission_tiers 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Product Commissions policies
CREATE POLICY "Product commissions are viewable by users in same tenant" 
  ON product_commissions 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Sales policies
CREATE POLICY "Sales are viewable by users in same tenant" 
  ON sales 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Affiliates can view their own sales" 
  ON sales 
  FOR SELECT 
  TO authenticated 
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Commission Distribution policies
CREATE POLICY "Commission distributions are viewable by users in same tenant" 
  ON commission_distributions 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Affiliates can view their own distributions" 
  ON commission_distributions 
  FOR SELECT 
  TO authenticated 
  USING (beneficiary_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Payment Methods policies
CREATE POLICY "Payment methods are viewable by users in same tenant" 
  ON payment_methods 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Payouts policies
CREATE POLICY "Payouts are viewable by users in same tenant" 
  ON payouts 
  FOR SELECT 
  TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Affiliates can view their own payouts" 
  ON payouts 
  FOR SELECT 
  TO authenticated 
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));