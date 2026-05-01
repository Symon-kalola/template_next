CREATE TYPE "public"."category_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" integer,
	"status" "category_status" DEFAULT 'active' NOT NULL,
	"icon_url" varchar(500),
	"banner_url" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"return_window_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;