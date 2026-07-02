DO $$ 
BEGIN
  -- Be resilient to environments where migrations create objects in different schemas.
  PERFORM set_config('search_path', 'portal,public', true);

  EXECUTE 'ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT, ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId")';

  IF to_regclass('Task') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_assigneeId_fkey' AND conrelid = 'Task'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE';
  END IF;
END $$;
