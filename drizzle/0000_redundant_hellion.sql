CREATE TYPE "public"."marketing_asset_type" AS ENUM('logo', 'banner', 'other');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('trial', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TABLE "affiliate_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_name" varchar NOT NULL,
	"user_id" uuid NOT NULL,
	"referral_code" varchar,
	"current_tier" uuid,
	"website_url" varchar,
	"social_media" jsonb,
	"promotional_methods" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar NOT NULL,
	"product_id" uuid NOT NULL,
	"status" varchar DEFAULT 'pending',
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	CONSTRAINT "affiliate_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "affiliate_product_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid,
	"product_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tracking_link_id" uuid,
	"commission_tier_id" uuid NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"product_commission" numeric(10, 2) NOT NULL,
	"final_commission" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"referral_code" text NOT NULL,
	"current_tier_id" uuid,
	"parent_affiliate_id" uuid,
	"company_name" text NOT NULL,
	"website_url" text NOT NULL,
	"social_media" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tax_id" text,
	"tax_form_type" text,
	"payment_threshold" integer DEFAULT 100 NOT NULL,
	"preferred_currency" text DEFAULT 'USD' NOT NULL,
	"promotional_methods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{"followers":0,"reach":0,"engagement":0,"clicks":0,"conversions":0,"revenue":0}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"participation_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"link_id" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"participation_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"promo_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metrics" jsonb DEFAULT '{"reach":0,"engagement":0,"clicks":0,"conversions":0,"revenue":0}'::jsonb NOT NULL,
	"promotional_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"promotional_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"type" text NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rewards" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{"totalReach":0,"engagementRate":0,"conversions":0,"revenue":0}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"condition" varchar NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"value_type" varchar NOT NULL,
	"status" varchar NOT NULL,
	"priority" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commission_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tier_name" varchar NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"min_sales" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "marketing_asset_type" NOT NULL,
	"url" text NOT NULL,
	"public_id" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"image_url" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"sku" varchar NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"category" varchar,
	"status" varchar(10) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role_name" varchar NOT NULL,
	"description" text,
	"is_custom" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_name" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"subdomain" varchar NOT NULL,
	"logo_url" varchar,
	"primary_color" varchar DEFAULT '#1A73E8',
	"secondary_color" varchar DEFAULT '#34A853',
	"subscription_tier" varchar DEFAULT 'free',
	"max_users" integer DEFAULT 5,
	"status" "tenant_status" DEFAULT 'trial',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "tenants_domain_unique" UNIQUE("domain"),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"tracking_link_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracking_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tracking_code" varchar NOT NULL,
	"total_clicks" integer DEFAULT 0,
	"total_conversions" integer DEFAULT 0,
	"total_sales" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tracking_links_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar,
	"country_code" varchar,
	"timezone" varchar DEFAULT 'UTC',
	"language" varchar DEFAULT 'en',
	"referral_code" varchar,
	"terms_accepted" boolean DEFAULT false,
	"marketing_consent" boolean DEFAULT false,
	"role_id" uuid NOT NULL,
	"is_affiliate" boolean DEFAULT false,
	"password" varchar NOT NULL,
	"reset_token" text,
	"reset_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "affiliate_details" ADD CONSTRAINT "affiliate_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_details" ADD CONSTRAINT "affiliate_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_details" ADD CONSTRAINT "affiliate_details_current_tier_commission_tiers_id_fk" FOREIGN KEY ("current_tier") REFERENCES "public"."commission_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_invites" ADD CONSTRAINT "affiliate_invites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_invites" ADD CONSTRAINT "affiliate_invites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_product_commissions" ADD CONSTRAINT "affiliate_product_commissions_affiliate_id_users_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_product_commissions" ADD CONSTRAINT "affiliate_product_commissions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_product_commissions" ADD CONSTRAINT "affiliate_product_commissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_product_commissions" ADD CONSTRAINT "affiliate_product_commissions_tracking_link_id_tracking_links_id_fk" FOREIGN KEY ("tracking_link_id") REFERENCES "public"."tracking_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_product_commissions" ADD CONSTRAINT "affiliate_product_commissions_commission_tier_id_commission_tiers_id_fk" FOREIGN KEY ("commission_tier_id") REFERENCES "public"."commission_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_current_tier_id_commission_tiers_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."commission_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_parent_affiliate_id_affiliates_id_fk" FOREIGN KEY ("parent_affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_participation_id_campaign_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."campaign_participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_participation_id_campaign_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."campaign_participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_tiers" ADD CONSTRAINT "commission_tiers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_guidelines" ADD CONSTRAINT "marketing_guidelines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_affiliate_id_users_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_tracking_link_id_tracking_links_id_fk" FOREIGN KEY ("tracking_link_id") REFERENCES "public"."tracking_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_affiliate_id_users_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_links" ADD CONSTRAINT "tracking_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;