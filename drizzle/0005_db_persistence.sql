ALTER TABLE "nextjs_app_schema"."folders" DROP COLUMN "big_picture";--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" DROP COLUMN "composition";--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" DROP COLUMN "tone_mood";--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" DROP COLUMN "target_audience";--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "goal" text;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "platform" varchar(16);--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "color_tag" varchar(8);--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "canvas" jsonb;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD COLUMN "plan" jsonb;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."summaries" ADD COLUMN "graph" jsonb;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."summaries" ADD COLUMN "status" varchar(12);--> statement-breakpoint
CREATE UNIQUE INDEX "folders_user_client_idx" ON "nextjs_app_schema"."folders" USING btree ("user_id","client_id");
