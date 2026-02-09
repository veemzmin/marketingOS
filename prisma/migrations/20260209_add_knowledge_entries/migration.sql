-- Create knowledge_entries table
CREATE TABLE IF NOT EXISTS "knowledge_entries" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "claim" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "lastVerified" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "knowledge_entries_organizationId_category_idx"
ON "knowledge_entries"("organizationId", "category");

ALTER TABLE "knowledge_entries"
ADD CONSTRAINT "knowledge_entries_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
