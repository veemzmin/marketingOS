-- Add submission metadata to content versions
ALTER TABLE "content_versions" ADD COLUMN "submittedByUserId" TEXT;
ALTER TABLE "content_versions" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "content_versions" ADD COLUMN "submittedFromStatus" "ContentStatus";

ALTER TABLE "content_versions"
ADD CONSTRAINT "content_versions_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "content_versions_submittedByUserId_idx" ON "content_versions"("submittedByUserId");
