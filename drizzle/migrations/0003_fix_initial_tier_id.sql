-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'affiliates_initial_tier_id_fkey'
    ) THEN
        ALTER TABLE affiliates DROP CONSTRAINT affiliates_initial_tier_id_fkey;
    END IF;
END $$;

-- Drop the column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'initial_tier_id'
    ) THEN
        ALTER TABLE affiliates DROP COLUMN initial_tier_id;
    END IF;
END $$;

-- Add the column back with the correct constraints
ALTER TABLE affiliates 
ADD COLUMN initial_tier_id uuid REFERENCES affiliate_tiers(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_affiliates_initial_tier_id ON affiliates(initial_tier_id); 