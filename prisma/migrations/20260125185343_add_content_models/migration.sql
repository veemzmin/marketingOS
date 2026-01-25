-- AlterTable (handle drift - add name column if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE "users" ADD COLUMN "name" TEXT;
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "complianceScore" INTEGER,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "complianceScore" INTEGER NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_decisions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reviewedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_organizationId_idx" ON "content"("organizationId");

-- CreateIndex
CREATE INDEX "content_status_idx" ON "content"("status");

-- CreateIndex
CREATE INDEX "content_createdByUserId_idx" ON "content"("createdByUserId");

-- CreateIndex
CREATE INDEX "content_versions_contentId_idx" ON "content_versions"("contentId");

-- CreateIndex
CREATE INDEX "content_versions_createdByUserId_idx" ON "content_versions"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentId_versionNumber_key" ON "content_versions"("contentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "review_decisions_contentId_key" ON "review_decisions"("contentId");

-- CreateIndex
CREATE INDEX "review_decisions_contentId_idx" ON "review_decisions"("contentId");

-- CreateIndex
CREATE INDEX "review_decisions_reviewedByUserId_idx" ON "review_decisions"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
