CREATE TYPE "public"."shop_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"unit" varchar(100),
	"geo_lat" double precision,
	"geo_long" double precision,
	"status" "shop_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_primary_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_shop_admin" UNIQUE("shop_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "shop_admins" ADD CONSTRAINT "shop_admins_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_admins" ADD CONSTRAINT "shop_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;