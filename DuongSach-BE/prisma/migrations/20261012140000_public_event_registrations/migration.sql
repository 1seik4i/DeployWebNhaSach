CREATE TABLE "public_event_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "attendees_count" INTEGER NOT NULL DEFAULT 1 CHECK (attendees_count > 0),
  "registration_code" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_event_registrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "public_event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "public_event_registrations_registration_code_key" ON "public_event_registrations"("registration_code");
CREATE UNIQUE INDEX "public_event_registrations_event_id_email_key" ON "public_event_registrations"("event_id", "email");
