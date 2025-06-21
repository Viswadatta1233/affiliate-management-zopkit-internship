CREATE TABLE "influencer_insta_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" uuid NOT NULL,
	"profile_picture_url" varchar,
	"follower_count" integer NOT NULL,
	"average_engagement_rate" numeric(5, 4) NOT NULL,
	"male_percentage" numeric(5, 2) NOT NULL,
	"female_percentage" numeric(5, 2) NOT NULL,
	"audience_demographics_age_range" varchar,
	"top_audience_location" varchar,
	"is_connected" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "influencer_insta_analytics_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE
); 