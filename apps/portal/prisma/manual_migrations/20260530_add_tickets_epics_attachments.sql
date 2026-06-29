-- Manual migration: add Ticket/Epic + attachments scaffolding.
-- This is used because Prisma Migrate shadow DB application is currently blocked in this repo.

CREATE TYPE "portal"."TicketType" AS ENUM ('EPIC', 'TICKET');
CREATE TYPE "portal"."TicketStatus" AS ENUM (
  'BACKLOG',
  'PLANNED',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'CANCELLED',
  'REQUESTED',
  'QUOTED',
  'AWAITING_PAYMENT',
  'ACTIVE'
);

ALTER TABLE "portal"."Workspace" ADD COLUMN IF NOT EXISTS "nextTicketNumber" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "portal"."Ticket" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sprintId" TEXT,
  "createdById" TEXT NOT NULL,
  "assigneeId" TEXT,
  "parentId" TEXT,
  "number" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "type" "portal"."TicketType" NOT NULL DEFAULT 'TICKET',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "discipline" "portal"."TaskDiscipline" NOT NULL DEFAULT 'Other',
  "status" "portal"."TicketStatus" NOT NULL DEFAULT 'BACKLOG',
  "position" INTEGER NOT NULL DEFAULT 1000,
  "hoursEst" DOUBLE PRECISION,
  "hoursActual" DOUBLE PRECISION,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_workspaceId_fkey') THEN
    ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_sprintId_fkey') THEN
    ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_sprintId_fkey"
      FOREIGN KEY ("sprintId") REFERENCES "portal"."Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_createdById_fkey') THEN
    ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "portal"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_assigneeId_fkey') THEN
    ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "portal"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_parentId_fkey') THEN
    ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "portal"."Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_key_key" ON "portal"."Ticket"("key");
CREATE INDEX IF NOT EXISTS "Ticket_workspaceId_idx" ON "portal"."Ticket"("workspaceId");
CREATE INDEX IF NOT EXISTS "Ticket_sprintId_idx" ON "portal"."Ticket"("sprintId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "portal"."Ticket"("status");
CREATE INDEX IF NOT EXISTS "Ticket_type_idx" ON "portal"."Ticket"("type");
CREATE INDEX IF NOT EXISTS "Ticket_assigneeId_idx" ON "portal"."Ticket"("assigneeId");
CREATE INDEX IF NOT EXISTS "Ticket_parentId_idx" ON "portal"."Ticket"("parentId");
CREATE INDEX IF NOT EXISTS "Ticket_position_idx" ON "portal"."Ticket"("position");

CREATE TABLE IF NOT EXISTS "portal"."TicketComment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketComment_ticketId_fkey') THEN
    ALTER TABLE "portal"."TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "portal"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketComment_authorId_fkey') THEN
    ALTER TABLE "portal"."TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "portal"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TicketComment_ticketId_idx" ON "portal"."TicketComment"("ticketId");

CREATE TABLE IF NOT EXISTS "portal"."TicketAttachment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "uploaderId" TEXT,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketAttachment_ticketId_fkey') THEN
    ALTER TABLE "portal"."TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "portal"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TicketAttachment_uploaderId_fkey') THEN
    ALTER TABLE "portal"."TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploaderId_fkey"
      FOREIGN KEY ("uploaderId") REFERENCES "portal"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TicketAttachment_ticketId_idx" ON "portal"."TicketAttachment"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketAttachment_uploaderId_idx" ON "portal"."TicketAttachment"("uploaderId");

ALTER TABLE "portal"."Quote" ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_ticketId_fkey') THEN
    ALTER TABLE "portal"."Quote" ADD CONSTRAINT "Quote_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "portal"."Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Quote_ticketId_idx" ON "portal"."Quote"("ticketId");

ALTER TABLE "portal"."ActivityEvent" ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityEvent_ticketId_fkey') THEN
    ALTER TABLE "portal"."ActivityEvent" ADD CONSTRAINT "ActivityEvent_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "portal"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "ActivityEvent_ticketId_createdAt_idx" ON "portal"."ActivityEvent"("ticketId", "createdAt");

ALTER TABLE "portal"."TimeEntry" ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_ticketId_fkey') THEN
    ALTER TABLE "portal"."TimeEntry" ADD CONSTRAINT "TimeEntry_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "portal"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "TimeEntry_ticketId_createdAt_idx" ON "portal"."TimeEntry"("ticketId", "createdAt");

