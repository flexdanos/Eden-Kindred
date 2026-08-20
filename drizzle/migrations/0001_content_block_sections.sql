CREATE TYPE "public"."content_block_kind" AS ENUM('standalone', 'hero', 'scene', 'pinned', 'cta', 'gathering_preview', 'teaching_list');--> statement-breakpoint
ALTER TABLE "content_blocks" ADD COLUMN "kind" "content_block_kind" DEFAULT 'standalone' NOT NULL;--> statement-breakpoint
ALTER TABLE "content_blocks" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;