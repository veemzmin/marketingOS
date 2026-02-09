-- Add governance violations storage to content versions
ALTER TABLE "content_versions" ADD COLUMN "governanceViolations" JSONB;
