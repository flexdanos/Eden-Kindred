CREATE TYPE "public"."donation_status" AS ENUM('pending', 'succeeded', 'failed', 'abandoned', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."donation_type" AS ENUM('one_time', 'pledge');--> statement-breakpoint
CREATE TYPE "public"."momo_network" AS ENUM('mtn', 'vod', 'atl');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('paystack', 'bank_transfer', 'zelle', 'cash_app', 'other');--> statement-breakpoint
CREATE TYPE "public"."pledge_cadence" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."pledge_period_status" AS ENUM('pending', 'fulfilled', 'missed', 'waived');--> statement-breakpoint
CREATE TYPE "public"."pledge_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."release_type" AS ENUM('album', 'ep', 'single', 'live_session');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'editor', 'member');--> statement-breakpoint
CREATE TYPE "public"."team_resource_kind" AS ENUM('chord_chart', 'rehearsal_audio', 'setlist', 'note');--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text,
	"body" text,
	"data" jsonb,
	"media_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_blocks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_profile_id" uuid,
	"donor_email" text,
	"donor_name" text,
	"donor_phone" text,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'GHS' NOT NULL,
	"type" "donation_type" DEFAULT 'one_time' NOT NULL,
	"status" "donation_status" DEFAULT 'pending' NOT NULL,
	"provider" "payment_provider" DEFAULT 'paystack' NOT NULL,
	"provider_reference" text NOT NULL,
	"recorded_by" uuid,
	"note" text,
	"channel" text,
	"momo_network" "momo_network",
	"pledge_id" uuid,
	"pledge_period_id" uuid,
	"campaign_slug" text,
	"is_public_display" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"cover_media_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" text DEFAULT 'media' NOT NULL,
	"path" text NOT NULL,
	"alt_text" text,
	"width" integer,
	"height" integer,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount_minor" integer NOT NULL,
	"cadence" "pledge_cadence" DEFAULT 'monthly' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pledge_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pledge_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"amount_minor_expected" integer NOT NULL,
	"status" "pledge_period_status" DEFAULT 'pending' NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pledges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"tier_id" uuid,
	"amount_minor" integer NOT NULL,
	"cadence" "pledge_cadence" DEFAULT 'monthly' NOT NULL,
	"status" "pledge_status" DEFAULT 'active' NOT NULL,
	"partner_name" text,
	"partner_email" text,
	"partner_phone" text,
	"momo_network" "momo_network",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_reminder_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"cover_media_id" uuid,
	"author_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"phone" text,
	"role" "role" DEFAULT 'member' NOT NULL,
	"is_team_member" boolean DEFAULT false NOT NULL,
	"instrument" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"track_number" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"duration_seconds" integer,
	"written_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" "release_type" DEFAULT 'single' NOT NULL,
	"description" text,
	"released_at" date,
	"cover_media_id" uuid,
	"spotify_url" text,
	"apple_music_url" text,
	"youtube_url" text,
	"bandcamp_url" text,
	"youtube_video_id" text,
	"spotify_embed_id" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "releases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"kind" "team_resource_kind" DEFAULT 'note' NOT NULL,
	"body" text,
	"media_id" uuid,
	"external_url" text,
	"event_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'paystack' NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_profile_id_profiles_id_fk" FOREIGN KEY ("donor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_pledge_id_pledges_id_fk" FOREIGN KEY ("pledge_id") REFERENCES "public"."pledges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_pledge_period_id_pledge_periods_id_fk" FOREIGN KEY ("pledge_period_id") REFERENCES "public"."pledge_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pledge_periods" ADD CONSTRAINT "pledge_periods_pledge_id_pledges_id_fk" FOREIGN KEY ("pledge_id") REFERENCES "public"."pledges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_tier_id_partnership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."partnership_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_tracks" ADD CONSTRAINT "release_tracks_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_resources" ADD CONSTRAINT "team_resources_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_resources" ADD CONSTRAINT "team_resources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_resources" ADD CONSTRAINT "team_resources_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "donations_provider_reference_unique" ON "donations" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE INDEX "donations_status_paid_idx" ON "donations" USING btree ("status","paid_at");--> statement-breakpoint
CREATE INDEX "donations_public_display_idx" ON "donations" USING btree ("is_public_display","paid_at");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pledge_periods_unique_window" ON "pledge_periods" USING btree ("pledge_id","period_start");--> statement-breakpoint
CREATE INDEX "pledge_periods_due_idx" ON "pledge_periods" USING btree ("status","due_at");--> statement-breakpoint
CREATE INDEX "pledges_reminder_idx" ON "pledges" USING btree ("status","next_reminder_at");--> statement-breakpoint
CREATE INDEX "posts_published_idx" ON "posts" USING btree ("is_published","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "release_tracks_order" ON "release_tracks" USING btree ("release_id","track_number");--> statement-breakpoint
CREATE INDEX "releases_published_idx" ON "releases" USING btree ("is_published","released_at");--> statement-breakpoint
CREATE INDEX "team_resources_event_idx" ON "team_resources" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_unique" ON "webhook_events" USING btree ("provider","event_id");