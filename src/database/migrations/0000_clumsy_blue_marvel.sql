CREATE TYPE "public"."platform_enum" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."queue_status_enum" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('ADMIN', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TABLE "black_list_token" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token" text,
	"expires_at" timestamp DEFAULT now(),
	CONSTRAINT "black_list_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"mime_type" varchar,
	"extension" varchar,
	"bucket" varchar,
	"status" "queue_status_enum" DEFAULT 'PROCESSING' NOT NULL,
	"created_by" varchar,
	"updated_by" varchar,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_route_manage" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"route" text NOT NULL,
	"status" boolean DEFAULT true,
	"ingestion_type_id" varchar,
	"client_email" varchar(255),
	"created_by" varchar,
	"updated_by" varchar,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_tracker" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"ingestion_route_manage_id" varchar,
	"content_id" varchar NOT NULL,
	"status" "queue_status_enum" DEFAULT 'PROCESSING' NOT NULL,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_type_manage" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"status" boolean DEFAULT true,
	"ingestion_type" varchar(255) DEFAULT 'ingestDoc',
	"created_by" varchar,
	"updated_by" varchar,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_doc_roles" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"role" "role_enum" NOT NULL,
	"doc_id" varchar,
	"created_by" varchar,
	"updated_by" varchar,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"platform_role" "platform_enum" DEFAULT 'USER' NOT NULL,
	"created_date" timestamp DEFAULT now(),
	"updated_date" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_route_manage" ADD CONSTRAINT "ingestion_route_manage_ingestion_type_id_ingestion_type_manage_id_fk" FOREIGN KEY ("ingestion_type_id") REFERENCES "public"."ingestion_type_manage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_route_manage" ADD CONSTRAINT "ingestion_route_manage_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_route_manage" ADD CONSTRAINT "ingestion_route_manage_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_tracker" ADD CONSTRAINT "ingestion_tracker_ingestion_route_manage_id_ingestion_route_manage_id_fk" FOREIGN KEY ("ingestion_route_manage_id") REFERENCES "public"."ingestion_route_manage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_type_manage" ADD CONSTRAINT "ingestion_type_manage_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_type_manage" ADD CONSTRAINT "ingestion_type_manage_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_doc_roles" ADD CONSTRAINT "user_doc_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_doc_roles" ADD CONSTRAINT "user_doc_roles_doc_id_documents_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_doc_roles" ADD CONSTRAINT "user_doc_roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_doc_roles" ADD CONSTRAINT "user_doc_roles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "title_idx" ON "documents" USING btree ("title");--> statement-breakpoint
CREATE INDEX "ingestion_route_idx" ON "ingestion_route_manage" USING btree ("route");--> statement-breakpoint
CREATE INDEX "ingestion_route_manage_id_idx" ON "ingestion_tracker" USING btree ("ingestion_route_manage_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user_doc_roles" USING btree ("user_id");