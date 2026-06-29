ALTER TABLE "portal"."Ticket" ADD COLUMN IF NOT EXISTS "subtaskOfId" TEXT;

CREATE INDEX IF NOT EXISTS "Ticket_subtaskOfId_idx" ON "portal"."Ticket"("subtaskOfId");

DO $$ BEGIN
  ALTER TABLE "portal"."Ticket"
    ADD CONSTRAINT "Ticket_subtaskOfId_fkey"
    FOREIGN KEY ("subtaskOfId") REFERENCES "portal"."Ticket"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
