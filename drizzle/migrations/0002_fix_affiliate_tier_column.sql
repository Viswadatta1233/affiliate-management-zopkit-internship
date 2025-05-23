-- Add initial_tier_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'initial_tier_id'
    ) THEN
        ALTER TABLE affiliates 
        ADD COLUMN initial_tier_id uuid REFERENCES affiliate_tiers(id);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'affiliates_initial_tier_id_fkey'
    ) THEN
        ALTER TABLE affiliates 
        ADD CONSTRAINT affiliates_initial_tier_id_fkey 
        FOREIGN KEY (initial_tier_id) 
        REFERENCES affiliate_tiers(id);
    END IF;
END $$; 