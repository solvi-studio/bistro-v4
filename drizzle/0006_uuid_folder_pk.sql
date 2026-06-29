-- Drop FK constraints before changing column types (integer→uuid has no implicit cast).
ALTER TABLE "nextjs_app_schema"."summaries" DROP CONSTRAINT "summaries_folder_id_folders_id_fk";--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."tasks" DROP CONSTRAINT "tasks_folder_id_folders_id_fk";--> statement-breakpoint

-- Change folders.id from serial (integer) to uuid.
-- Existing rows get a fresh random UUID; no downstream reference can match them
-- (dev data only — summaries/tasks FKs are set to NULL below).
ALTER TABLE "nextjs_app_schema"."folders" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

-- FK columns: old integer values have no UUID match — set to NULL.
ALTER TABLE "nextjs_app_schema"."summaries" ALTER COLUMN "folder_id" SET DATA TYPE uuid USING NULL::uuid;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."tasks" ALTER COLUMN "folder_id" SET DATA TYPE uuid USING NULL::uuid;--> statement-breakpoint

-- Re-add FK constraints with correct type.
ALTER TABLE "nextjs_app_schema"."summaries" ADD CONSTRAINT "summaries_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "nextjs_app_schema"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."tasks" ADD CONSTRAINT "tasks_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "nextjs_app_schema"."folders"("id") ON DELETE cascade ON UPDATE no action;
