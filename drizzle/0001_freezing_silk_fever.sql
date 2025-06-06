CREATE TABLE "influencers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"social_media" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"niche" varchar NOT NULL,
	"country" varchar NOT NULL,
	"bio" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"metrics" jsonb DEFAULT '{"followers":0,"engagement":0,"reach":0}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;