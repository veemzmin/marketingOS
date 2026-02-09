import { ReviewerType } from "@/lib/db/types";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

/**
 * Determine required reviewer types based on content
 */
export function getRequiredReviewers(topic?: string): ReviewerType[] {
  const reviewers: ReviewerType[] = ["MARKETING"]; // Always required

  // Requires CLINICAL if topic is mental-health, crisis, or substance-use
  if (
    topic &&
    ["mental-health", "crisis", "substance-use"].includes(topic.toLowerCase())
  ) {
    reviewers.push("CLINICAL");
  }

  return reviewers;
}

/**
 * Check if content can be approved (all required reviews completed and approved)
 */
export async function canApprove(contentId: string): Promise<boolean> {
  try {
    // Get all assignments for this content
    const assignments = await db.reviewAssignment.findMany({
      where: { contentId },
    });

    if (assignments.length === 0) {
      return false;
    }

    // All assignments must be COMPLETED
    if (!assignments.every((a) => a.status === "COMPLETED")) {
      return false;
    }

    // Get all decisions for this content
    const decisions = await db.reviewDecision.findMany({
      where: { contentId },
    });

    // Must have same number of decisions as assignments
    if (decisions.length !== assignments.length) {
      return false;
    }

    // All decisions must be APPROVED
    if (!decisions.every((d) => d.decision === "APPROVED")) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error checking if content can be approved:", error);
    return false;
  }
}

/**
 * Check if any review was rejected
 */
export async function hasRejection(contentId: string): Promise<boolean> {
  try {
    const decisions = await db.reviewDecision.findMany({
      where: {
        contentId,
        decision: "REJECTED"
      },
    });

    return decisions.length > 0;
  } catch (error) {
    logger.error("Error checking for rejections:", error);
    return false;
  }
}

/**
 * Check if any review requested changes
 */
export async function hasChangesRequested(contentId: string): Promise<boolean> {
  try {
    const decisions = await db.reviewDecision.findMany({
      where: {
        contentId,
        decision: "CHANGES_REQUESTED"
      },
    });

    return decisions.length > 0;
  } catch (error) {
    logger.error("Error checking for change requests:", error);
    return false;
  }
}
