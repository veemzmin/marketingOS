"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ReviewerType } from "@/lib/db/types";
import {
  notifyReviewersOfNewContent,
  notifyCreatorOfReviewStart,
  notifyCreatorOfDecision,
} from "@/lib/notifications/review";

export type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Submit content for review - creates assignments for required reviewer types
 */
export async function submitForReview(
  contentId: string
): Promise<Result> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get content with latest version
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        organization: true,
      },
    });

    if (!content) {
      return { success: false, error: "Content not found" };
    }

    // Verify user is content creator or admin
    if (
      content.createdByUserId !== user.id &&
      !user.userOrganizations.some(
        (uo) =>
          uo.organizationId === content.organizationId && uo.role === "ADMIN"
      )
    ) {
      return { success: false, error: "Only the content creator or admin can submit for review" };
    }

    // Verify content has passing compliance score (>= 70)
    if (!content.complianceScore || content.complianceScore < 70) {
      return {
        success: false,
        error: "Content must have a compliance score of at least 70 to submit for review",
      };
    }

    // Determine required reviewer types
    const latestVersion = content.versions[0];
    const requiredReviewers = getRequiredReviewers(latestVersion?.topic);

    // Create review assignments
    await db.$transaction(async (tx) => {
      // Create assignments for each required reviewer type
      for (const reviewerType of requiredReviewers) {
        await tx.reviewAssignment.create({
          data: {
            contentId,
            reviewerType,
            status: "PENDING",
          },
        });
      }

      // Update content status
      await tx.content.update({
        where: { id: contentId },
        data: { status: "SUBMITTED" },
      });

      // Log to audit
      await logAudit({
        organizationId: content.organizationId,
        userId: user.id,
        action: "submit",
        resource: "content",
        resourceId: contentId,
        metadata: {
          requiredReviewers,
        },
      });
    });

    // Send notifications to reviewers (async, don't wait)
    notifyReviewersOfNewContent(contentId, requiredReviewers).catch((error) =>
      console.error("Failed to send reviewer notifications:", error)
    );

    revalidatePath(`/dashboard/content/${contentId}/edit`);
    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/reviews");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error submitting content for review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit for review",
    };
  }
}

/**
 * Claim a review assignment
 */
export async function claimReview(
  assignmentId: string
): Promise<Result> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the assignment
    const assignment = await db.reviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        content: {
          include: { organization: true },
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Verify user has correct reviewer type in this organization
    const userReviewerType = await db.userReviewerType.findUnique({
      where: {
        userId_organizationId_reviewerType: {
          userId: user.id,
          organizationId: assignment.content.organizationId,
          reviewerType: assignment.reviewerType,
        },
      },
    });

    if (!userReviewerType) {
      return {
        success: false,
        error: `You are not authorized as a ${assignment.reviewerType.toLowerCase()} reviewer`,
      };
    }

    // Verify assignment is still pending
    if (assignment.status !== "PENDING") {
      return {
        success: false,
        error: "This review has already been claimed",
      };
    }

    // Claim the assignment
    await db.$transaction(async (tx) => {
      await tx.reviewAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "IN_PROGRESS",
          assignedUserId: user.id,
        },
      });

      // Update content status to IN_REVIEW
      await tx.content.update({
        where: { id: assignment.contentId },
        data: { status: "IN_REVIEW" },
      });

      // Log to audit
      await logAudit({
        organizationId: assignment.content.organizationId,
        userId: user.id,
        action: "claim",
        resource: "review_assignment",
        resourceId: assignmentId,
      });
    });

    // Notify creator that review has started (async, don't wait)
    notifyCreatorOfReviewStart(assignment.contentId, assignment.reviewerType).catch(
      (error) => console.error("Failed to send review start notification:", error)
    );

    revalidatePath("/dashboard/reviews");
    revalidatePath(`/dashboard/reviews/${assignmentId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error claiming review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim review",
    };
  }
}

/**
 * Get review queue for current user
 */
export async function getReviewQueue() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's reviewer types across all organizations
    const userReviewerTypes = await db.userReviewerType.findMany({
      where: { userId: user.id },
    });

    if (userReviewerTypes.length === 0) {
      return { success: true, data: [] };
    }

    // Get pending assignments matching user's reviewer types
    const assignments = await db.reviewAssignment.findMany({
      where: {
        status: "PENDING",
        reviewerType: {
          in: userReviewerTypes.map((urt) => urt.reviewerType),
        },
        content: {
          organizationId: {
            in: userReviewerTypes.map((urt) => urt.organizationId),
          },
        },
      },
      include: {
        content: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc", // FIFO
      },
    });

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Error getting review queue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get review queue",
    };
  }
}

/**
 * Get reviews assigned to current user
 */
export async function getMyAssignedReviews() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const assignments = await db.reviewAssignment.findMany({
      where: {
        assignedUserId: user.id,
        status: "IN_PROGRESS",
      },
      include: {
        content: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Error getting assigned reviews:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get assigned reviews",
    };
  }
}

/**
 * Get completed reviews by current user
 */
export async function getMyCompletedReviews() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const decisions = await db.reviewDecision.findMany({
      where: {
        reviewedByUserId: user.id,
      },
      include: {
        content: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: decisions };
  } catch (error) {
    console.error("Error getting completed reviews:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get completed reviews",
    };
  }
}

/**
 * Determine required reviewer types based on content topic
 */
function getRequiredReviewers(topic?: string): ReviewerType[] {
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
    const assignments = await db.reviewAssignment.findMany({
      where: { contentId },
      include: {
        content: {
          include: {
            reviewDecisions: true,
          },
        },
      },
    });

    // All assignments must be COMPLETED
    if (!assignments.every((a) => a.status === "COMPLETED")) {
      return false;
    }

    // All decisions must be APPROVED
    const decisions = assignments[0]?.content.reviewDecisions || [];
    if (!decisions.every((d) => d.decision === "APPROVED")) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking if content can be approved:", error);
    return false;
  }
}

/**
 * Submit review decision
 */
export async function submitDecision(data: {
  assignmentId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  comment?: string;
}): Promise<Result> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the assignment
    const assignment = await db.reviewAssignment.findUnique({
      where: { id: data.assignmentId },
      include: {
        content: {
          include: {
            organization: true,
            reviewAssignments: true,
          },
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Verify user is assigned to this review
    if (assignment.assignedUserId !== user.id) {
      return {
        success: false,
        error: "You are not assigned to this review",
      };
    }

    // Verify assignment is in progress
    if (assignment.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "This review is not in progress",
      };
    }

    // Create decision and update statuses
    await db.$transaction(async (tx) => {
      // Create review decision
      await tx.reviewDecision.create({
        data: {
          contentId: assignment.contentId,
          reviewerType: assignment.reviewerType,
          decision: data.decision,
          reviewedByUserId: user.id,
          comment: data.comment,
        },
      });

      // Update assignment status
      await tx.reviewAssignment.update({
        where: { id: data.assignmentId },
        data: { status: "COMPLETED" },
      });

      // Check if all reviews are complete and determine content status
      const allAssignments = await tx.reviewAssignment.findMany({
        where: { contentId: assignment.contentId },
      });

      const allDecisions = await tx.reviewDecision.findMany({
        where: { contentId: assignment.contentId },
      });

      let newContentStatus = assignment.content.status;

      if (allAssignments.every((a) => a.status === "COMPLETED")) {
        // All reviews are complete
        const hasRejection = allDecisions.some((d) => d.decision === "REJECTED");
        const hasChangesRequested = allDecisions.some(
          (d) => d.decision === "CHANGES_REQUESTED"
        );
        const allApproved = allDecisions.every((d) => d.decision === "APPROVED");

        if (hasRejection) {
          newContentStatus = "REJECTED";
        } else if (hasChangesRequested) {
          newContentStatus = "DRAFT"; // Return to creator
        } else if (allApproved) {
          newContentStatus = "APPROVED";
        }

        // Update content status
        await tx.content.update({
          where: { id: assignment.contentId },
          data: { status: newContentStatus },
        });
      }

      // Log to audit
      await logAudit({
        organizationId: assignment.content.organizationId,
        userId: user.id,
        action: "review",
        resource: "content",
        resourceId: assignment.contentId,
        metadata: {
          decision: data.decision,
          reviewerType: assignment.reviewerType,
          newContentStatus,
        },
      });
    });

    // Notify creator of decision (async, don't wait)
    notifyCreatorOfDecision(assignment.contentId, {
      decision: data.decision,
      reviewerType: assignment.reviewerType,
      comment: data.comment,
    }).catch((error) =>
      console.error("Failed to send decision notification:", error)
    );

    revalidatePath("/dashboard/reviews");
    revalidatePath(`/dashboard/reviews/${data.assignmentId}`);
    revalidatePath("/dashboard/content");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error submitting decision:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit decision",
    };
  }
}
