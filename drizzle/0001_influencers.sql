-- Create enum for influencer status
CREATE TYPE influencer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create influencers table
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    social_media JSONB NOT NULL DEFAULT '{}',
    niche VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    bio TEXT,
    status influencer_status NOT NULL DEFAULT 'pending',
    metrics JSONB NOT NULL DEFAULT '{
        "followers": 0,
        "engagement": 0,
        "reach": 0,
        "total_campaigns": 0,
        "total_earnings": 0
    }',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS influencers_user_id_idx ON influencers(user_id);
CREATE INDEX IF NOT EXISTS influencers_status_idx ON influencers(status);
CREATE INDEX IF NOT EXISTS influencers_niche_idx ON influencers(niche);
CREATE INDEX IF NOT EXISTS influencers_country_idx ON influencers(country);

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_influencers_updated_at
    BEFORE UPDATE ON influencers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to the table and columns
COMMENT ON TABLE influencers IS 'Stores information about influencers in the platform';
COMMENT ON COLUMN influencers.id IS 'Unique identifier for the influencer';
COMMENT ON COLUMN influencers.user_id IS 'Reference to the users table';
COMMENT ON COLUMN influencers.social_media IS 'JSON object containing social media links';
COMMENT ON COLUMN influencers.niche IS 'The influencer''s primary content category';
COMMENT ON COLUMN influencers.country IS 'The influencer''s country of residence';
COMMENT ON COLUMN influencers.bio IS 'Short biography or description of the influencer';
COMMENT ON COLUMN influencers.status IS 'Current status of the influencer account';
COMMENT ON COLUMN influencers.metrics IS 'JSON object containing performance metrics';
COMMENT ON COLUMN influencers.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN influencers.updated_at IS 'Timestamp when the record was last updated'; 