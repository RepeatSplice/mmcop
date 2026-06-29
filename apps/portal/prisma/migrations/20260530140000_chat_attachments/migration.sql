-- Allow empty message body when attachments exist
ALTER TABLE "portal"."WorkspaceChatMessage" ALTER COLUMN "body" SET DEFAULT '';

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal"."WorkspaceChatAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "discordAttachmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceChatAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceChatAttachment_discordAttachmentId_key"
  ON "portal"."WorkspaceChatAttachment"("discordAttachmentId");
CREATE INDEX IF NOT EXISTS "WorkspaceChatAttachment_messageId_idx"
  ON "portal"."WorkspaceChatAttachment"("messageId");

DO $$ BEGIN
  ALTER TABLE "portal"."WorkspaceChatAttachment"
    ADD CONSTRAINT "WorkspaceChatAttachment_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "portal"."WorkspaceChatMessage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
