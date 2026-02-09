"use server";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface KnowledgeEntry {
  id: string;
  category: string;
  claim: string;
  source: string;
  lastVerified: Date;
}

/**
 * Search knowledge base for relevant facts
 * Uses simple keyword matching - can be enhanced with vector search later
 */
export async function getRelevantFacts(
  organizationId: string,
  keywords: string[],
  limit: number = 5
): Promise<KnowledgeEntry[]> {
  if (keywords.length === 0) return [];

  try {
    // Build search query - look for any keyword in the claim
    const searchTerms = keywords.map((k) => k.toLowerCase());

    const entries = await db.knowledgeEntry.findMany({
      where: {
        organizationId,
        OR: searchTerms.map((term) => ({
          claim: {
            contains: term,
            mode: "insensitive" as const,
          },
        })),
      },
      orderBy: {
        lastVerified: "desc",
      },
      take: limit,
    });

    return entries.map((e) => ({
      id: e.id,
      category: e.category,
      claim: e.claim,
      source: e.source,
      lastVerified: e.lastVerified,
    }));
  } catch (error) {
    logger.error("Error searching knowledge base:", error);
    return [];
  }
}

/**
 * Add a new knowledge entry
 */
export async function addKnowledgeEntry(
  organizationId: string,
  data: {
    category: string;
    claim: string;
    source: string;
  }
): Promise<KnowledgeEntry> {
  const entry = await db.knowledgeEntry.create({
    data: {
      organizationId,
      category: data.category,
      claim: data.claim,
      source: data.source,
      lastVerified: new Date(),
    },
  });

  return {
    id: entry.id,
    category: entry.category,
    claim: entry.claim,
    source: entry.source,
    lastVerified: entry.lastVerified,
  };
}

/**
 * Get all knowledge entries for an organization
 */
export async function getOrganizationKnowledge(
  organizationId: string,
  category?: string
): Promise<KnowledgeEntry[]> {
  const entries = await db.knowledgeEntry.findMany({
    where: {
      organizationId,
      ...(category && { category }),
    },
    orderBy: {
      lastVerified: "desc",
    },
  });

  return entries.map((e) => ({
    id: e.id,
    category: e.category,
    claim: e.claim,
    source: e.source,
    lastVerified: e.lastVerified,
  }));
}

/**
 * Update verification date for a knowledge entry
 */
export async function verifyKnowledgeEntry(entryId: string): Promise<void> {
  await db.knowledgeEntry.update({
    where: { id: entryId },
    data: { lastVerified: new Date() },
  });
}

/**
 * Delete a knowledge entry
 */
export async function deleteKnowledgeEntry(entryId: string): Promise<void> {
  await db.knowledgeEntry.delete({
    where: { id: entryId },
  });
}

/**
 * Seed initial knowledge base with common mental health facts
 */
export async function seedKnowledgeBase(organizationId: string): Promise<number> {
  const seedData = [
    {
      category: "statistic",
      claim:
        "1 in 5 adults in the US experience mental illness each year (NAMI, 2023)",
      source: "National Alliance on Mental Illness (NAMI) 2023 Report",
    },
    {
      category: "statistic",
      claim:
        "Depression affects more than 280 million people worldwide (WHO, 2023)",
      source: "World Health Organization 2023",
    },
    {
      category: "treatment",
      claim:
        "Evidence-based treatments for depression include cognitive behavioral therapy (CBT), interpersonal therapy, and medication",
      source: "APA Clinical Practice Guidelines 2023",
    },
    {
      category: "treatment",
      claim:
        "Recovery from mental illness is possible - many people with mental health conditions live fulfilling lives with proper treatment and support",
      source: "SAMHSA National Recovery Framework",
    },
    {
      category: "crisis",
      claim:
        "The 988 Suicide & Crisis Lifeline provides free, confidential support 24/7 for people in distress",
      source: "SAMHSA 988 Lifeline Official Resource",
    },
    {
      category: "condition",
      claim:
        "Major Depressive Disorder is characterized by persistent sadness, loss of interest, and impaired functioning for at least 2 weeks",
      source: "DSM-5-TR Diagnostic Criteria",
    },
    {
      category: "condition",
      claim:
        "Generalized Anxiety Disorder involves excessive worry about various concerns, present more days than not for at least 6 months",
      source: "DSM-5-TR Diagnostic Criteria",
    },
    {
      category: "treatment",
      claim:
        "Psychotherapy and medication, either alone or in combination, have been shown effective for treating most mental health conditions",
      source: "NIH National Institute of Mental Health",
    },
  ];

  const created = await db.knowledgeEntry.createMany({
    data: seedData.map((item) => ({
      organizationId,
      category: item.category,
      claim: item.claim,
      source: item.source,
      lastVerified: new Date(),
    })),
  });

  return created.count;
}
