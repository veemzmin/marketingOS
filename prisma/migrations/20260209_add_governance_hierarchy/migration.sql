-- Add campaign status enum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- Create clients
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clients_organizationId_slug_key" ON "clients"("organizationId", "slug");
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Truth packs
CREATE TABLE "truth_packs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "truth_packs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "truth_packs_clientId_key" ON "truth_packs"("clientId");
CREATE INDEX "truth_packs_clientId_idx" ON "truth_packs"("clientId");

ALTER TABLE "truth_packs" ADD CONSTRAINT "truth_packs_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Governance profiles
CREATE TABLE "governance_profiles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "governance_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "governance_profiles_clientId_idx" ON "governance_profiles"("clientId");

ALTER TABLE "governance_profiles" ADD CONSTRAINT "governance_profiles_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Campaigns
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "governanceProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_clientId_idx" ON "campaigns"("clientId");
CREATE INDEX "campaigns_governanceProfileId_idx" ON "campaigns"("governanceProfileId");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_governanceProfileId_fkey"
    FOREIGN KEY ("governanceProfileId") REFERENCES "governance_profiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Content links to client/campaign
ALTER TABLE "content" ADD COLUMN "clientId" TEXT;
ALTER TABLE "content" ADD COLUMN "campaignId" TEXT;

CREATE INDEX "content_clientId_idx" ON "content"("clientId");
CREATE INDEX "content_campaignId_idx" ON "content"("campaignId");

ALTER TABLE "content" ADD CONSTRAINT "content_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "content" ADD CONSTRAINT "content_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
