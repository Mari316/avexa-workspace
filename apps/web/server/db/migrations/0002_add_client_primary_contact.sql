ALTER TABLE "clients" ADD COLUMN "primary_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_primary_contact_belongs_to_client" FOREIGN KEY ("primary_contact_id","id") REFERENCES "public"."contacts"("id","client_id") ON DELETE SET NULL ("primary_contact_id") ON UPDATE no action;
