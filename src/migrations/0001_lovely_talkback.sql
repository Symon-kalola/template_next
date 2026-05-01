CREATE TABLE "access_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_rights_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_access_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" uuid NOT NULL,
	"access_right_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_role_access_right" UNIQUE("role_id","access_right_id")
);
--> statement-breakpoint
ALTER TABLE "role_access_rights" ADD CONSTRAINT "role_access_rights_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_access_rights" ADD CONSTRAINT "role_access_rights_access_right_id_access_rights_id_fk" FOREIGN KEY ("access_right_id") REFERENCES "public"."access_rights"("id") ON DELETE cascade ON UPDATE no action;