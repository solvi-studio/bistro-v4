-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "bistro_fe";
--> statement-breakpoint
CREATE TYPE "bistro_fe"."phase" AS ENUM('pre-production', 'production', 'post-production');--> statement-breakpoint
CREATE TABLE "bistro_fe"."folders" (
	"id" serial NOT NULL,
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
CREATE TABLE "bistro_fe"."summaries" (
	"id" serial NOT NULL,
	"folder_id" integer,
	"summary_result" jsonb,
	"completion" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bistro_fe"."tasks" (
	"id" serial NOT NULL,
	"folder_id" integer,
	"name" varchar(255),
	"phase" "bistro_fe"."phase",
	"date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bistro_fe"."users" (
	"id" text NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bistro_fe"."folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "bistro_fe"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bistro_fe"."summaries" ADD CONSTRAINT "summaries_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "bistro_fe"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bistro_fe"."tasks" ADD CONSTRAINT "tasks_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "bistro_fe"."folders"("id") ON DELETE cascade ON UPDATE no action;
*/