-- CREATE SCHEMA "nextjs_app_schema"; comment this out as this will result in error
--> statement-breakpoint
CREATE TYPE "nextjs_app_schema"."phase" AS ENUM('pre-production', 'production', 'post-production');--> statement-breakpoint
CREATE TABLE "nextjs_app_schema"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nextjs_app_schema"."folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" varchar(255),
	"emoji" varchar(8),
	"big_picture" jsonb,
	"composition" jsonb,
	"tone_mood" jsonb,
	"target_audience" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nextjs_app_schema"."tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"folder_id" integer,
	"name" varchar(255),
	"phase" "nextjs_app_schema"."phase",
	"date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nextjs_app_schema"."summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"folder_id" integer,
	"summary_result" jsonb,
	"completion" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "nextjs_app_schema"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."tasks" ADD CONSTRAINT "tasks_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "nextjs_app_schema"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nextjs_app_schema"."summaries" ADD CONSTRAINT "summaries_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "nextjs_app_schema"."folders"("id") ON DELETE no action ON UPDATE no action;