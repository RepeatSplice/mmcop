-- Sprint board columns (system + custom) and ticket column placement
CREATE TABLE "portal"."WorkspaceBoardColumn" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "portal"."TicketStatus" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceBoardColumn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceBoardColumn_workspaceId_id_key" ON "portal"."WorkspaceBoardColumn"("workspaceId", "id");
CREATE INDEX "WorkspaceBoardColumn_workspaceId_position_idx" ON "portal"."WorkspaceBoardColumn"("workspaceId", "position");

ALTER TABLE "portal"."WorkspaceBoardColumn" ADD CONSTRAINT "WorkspaceBoardColumn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "portal"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portal"."Ticket" ADD COLUMN "boardColumnId" TEXT;

CREATE INDEX "Ticket_boardColumnId_idx" ON "portal"."Ticket"("boardColumnId");

ALTER TABLE "portal"."Ticket" ADD CONSTRAINT "Ticket_workspaceId_boardColumnId_fkey" FOREIGN KEY ("workspaceId", "boardColumnId") REFERENCES "portal"."WorkspaceBoardColumn"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
