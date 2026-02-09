-- Ensure reviewer type enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReviewerType') THEN
    CREATE TYPE "ReviewerType" AS ENUM ('CLINICAL', 'MARKETING');
  END IF;
END $$;

-- Ensure review assignments table exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'review_assignments'
  ) THEN
    CREATE TABLE "review_assignments" (
      "id" TEXT NOT NULL,
      "contentId" TEXT NOT NULL,
      "reviewerType" "ReviewerType" NOT NULL,
      "assignedUserId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
    );

    ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_contentId_fkey"
    FOREIGN KEY ("contentId") REFERENCES "content"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_assignedUserId_fkey"
    FOREIGN KEY ("assignedUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

    CREATE INDEX "review_assignments_contentId_idx" ON "review_assignments"("contentId");
    CREATE INDEX "review_assignments_assignedUserId_idx" ON "review_assignments"("assignedUserId");
    CREATE INDEX "review_assignments_status_idx" ON "review_assignments"("status");
  END IF;
END $$;

-- Add content version linkage to review assignments
ALTER TABLE "review_assignments" ADD COLUMN "contentVersionId" TEXT;

-- Backfill existing assignments to latest content version
UPDATE "review_assignments" ra
SET "contentVersionId" = cv.id
FROM "content_versions" cv
WHERE cv."contentId" = ra."contentId"
  AND cv."versionNumber" = (
    SELECT MAX(cv2."versionNumber")
    FROM "content_versions" cv2
    WHERE cv2."contentId" = ra."contentId"
  );

ALTER TABLE "review_assignments" ALTER COLUMN "contentVersionId" SET NOT NULL;

ALTER TABLE "review_assignments"
ADD CONSTRAINT "review_assignments_contentVersionId_fkey"
FOREIGN KEY ("contentVersionId") REFERENCES "content_versions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "review_assignments_contentId_reviewerType_key";
CREATE UNIQUE INDEX "review_assignments_contentId_reviewerType_contentVersionId_key"
ON "review_assignments"("contentId", "reviewerType", "contentVersionId");

CREATE INDEX "review_assignments_contentVersionId_idx"
ON "review_assignments"("contentVersionId");
