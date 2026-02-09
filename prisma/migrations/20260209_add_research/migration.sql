-- CreateEnum
CREATE TYPE "ResearchRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResearchOutputType" AS ENUM ('EXEC_SUMMARY', 'FULL_REPORT', 'SLIDE_OUTLINE', 'DATA_APPENDIX', 'ACTION_PLAN', 'IDEAS');

-- CreateTable
CREATE TABLE "research_projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "ResearchRunStatus" NOT NULL DEFAULT 'PENDING',
    "questions" JSONB,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "research_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_sources" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "sourceType" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_outputs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "outputType" "ResearchOutputType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_projects_organizationId_idx" ON "research_projects"("organizationId");

-- CreateIndex
CREATE INDEX "research_projects_createdByUserId_idx" ON "research_projects"("createdByUserId");

-- CreateIndex
CREATE INDEX "research_runs_projectId_idx" ON "research_runs"("projectId");

-- CreateIndex
CREATE INDEX "research_runs_status_idx" ON "research_runs"("status");

-- CreateIndex
CREATE INDEX "research_sources_runId_idx" ON "research_sources"("runId");

-- CreateIndex
CREATE INDEX "research_outputs_runId_idx" ON "research_outputs"("runId");

-- CreateIndex
CREATE INDEX "research_outputs_outputType_idx" ON "research_outputs"("outputType");

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_runId_fkey" FOREIGN KEY ("runId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_outputs" ADD CONSTRAINT "research_outputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "research_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
