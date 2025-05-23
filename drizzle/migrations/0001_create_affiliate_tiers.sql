-- Create affiliate_tiers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_status') THEN
        CREATE TYPE affiliate_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS affiliate_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name varchar NOT NULL,
    description text,
    commission_rate decimal(5,2) NOT NULL,
    minimum_sales decimal(10,2),
    benefits jsonb DEFAULT '[]',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT fk_tenant
        FOREIGN KEY(tenant_id) 
        REFERENCES tenants(id)
        ON DELETE CASCADE
);

-- Insert default tiers if they don't exist
INSERT INTO affiliate_tiers (tenant_id, name, description, commission_rate, minimum_sales, benefits)
SELECT 
    t.id,
    'bronze',
    'Entry level affiliate tier',
    5.0,
    0,
    '["Basic commission rates", "Standard support"]'::jsonb
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM affiliate_tiers WHERE name = 'bronze' AND tenant_id = t.id
);

INSERT INTO affiliate_tiers (tenant_id, name, description, commission_rate, minimum_sales, benefits)
SELECT 
    t.id,
    'silver',
    'Mid-level affiliate tier',
    10.0,
    1000,
    '["Higher commission rates", "Priority support", "Monthly newsletter"]'::jsonb
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM affiliate_tiers WHERE name = 'silver' AND tenant_id = t.id
);

INSERT INTO affiliate_tiers (tenant_id, name, description, commission_rate, minimum_sales, benefits)
SELECT 
    t.id,
    'gold',
    'Top-level affiliate tier',
    15.0,
    5000,
    '["Premium commission rates", "VIP support", "Early access to promotions", "Custom marketing materials"]'::jsonb
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM affiliate_tiers WHERE name = 'gold' AND tenant_id = t.id
); 