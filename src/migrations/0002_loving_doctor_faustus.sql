CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'deactivated', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'deactivated', 'logged_out', 'expired');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"role_id" uuid,
	"service_number" varchar(100) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"rank" varchar(100),
	"unit" varchar(100),
	"otp_hash" varchar(255),
	"otp_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_service_number_unique" UNIQUE("service_number")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_info" text,
	"ip_address" varchar(45),
	"expires_at" timestamp NOT NULL,
	"refresh_token" varchar(255) NOT NULL,
	"location" varchar(255),
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;