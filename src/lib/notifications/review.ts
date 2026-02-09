import { sendEmail } from "@/lib/email/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ReviewerType } from "@/lib/db/types";
import { logger } from "@/lib/logger";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Notify reviewers of new content submission
 */
export async function notifyReviewersOfNewContent(
  contentId: string,
  requiredTypes: ReviewerType[]
): Promise<void> {
  try {
    // Get content details
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!content) {
      logger.error("Content not found for notification");
      return;
    }

    // Get all users with matching reviewer types in this organization
    const userReviewerTypes = await db.userReviewerType.findMany({
      where: {
        organizationId: content.organizationId,
        reviewerType: {
          in: requiredTypes,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Get unique users
    const reviewers = Array.from(
      new Map(
        userReviewerTypes.map((urt) => [urt.user.email, urt.user])
      ).values()
    );

    // Send email to each reviewer
    for (const reviewer of reviewers) {
      const reviewUrl = `${BASE_URL}/dashboard/reviews`;

      await sendEmail({
        to: reviewer.email,
        subject: `New content awaiting your review - ${content.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Review Request</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Content for Review</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${reviewer.name || reviewer.email},</p>

                <p style="font-size: 16px; margin-bottom: 20px;">New content has been submitted for review:</p>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: 600; font-size: 18px;">${content.title}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Submitted by ${content.createdBy.name || content.createdBy.email}</p>
                  ${content.complianceScore ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Compliance Score: ${content.complianceScore}/100</p>` : ''}
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${reviewUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">View Review Queue</a>
                </div>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="font-size: 13px; color: #999; margin: 0;">You are receiving this because you are a reviewer for ${content.organization.name}.</p>
              </div>
            </body>
          </html>
        `,
        text: `
Hi ${reviewer.name || reviewer.email},

New content has been submitted for review:

Title: ${content.title}
Submitted by: ${content.createdBy.name || content.createdBy.email}
${content.complianceScore ? `Compliance Score: ${content.complianceScore}/100` : ''}

View the review queue: ${reviewUrl}

You are receiving this because you are a reviewer for ${content.organization.name}.
        `.trim(),
      });

      // Log notification
      await logAudit({
        organizationId: content.organizationId,
        userId: null,
        action: "notify",
        resource: "review",
        resourceId: contentId,
        metadata: {
          notificationType: "new_content",
          recipient: reviewer.email,
        },
      });
    }
  } catch (error) {
    logger.error("Error notifying reviewers:", error);
  }
}

/**
 * Notify creator that review has started
 */
export async function notifyCreatorOfReviewStart(
  contentId: string,
  reviewerType: ReviewerType
): Promise<void> {
  try {
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!content) {
      logger.error("Content not found for notification");
      return;
    }

    const contentUrl = `${BASE_URL}/dashboard/content/list`;

    await sendEmail({
      to: content.createdBy.email,
      subject: `Your content is being reviewed - ${content.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Review In Progress</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Review In Progress</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${content.createdBy.name || content.createdBy.email},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">Your content is now being reviewed by a ${reviewerType.toLowerCase()} reviewer:</p>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; font-size: 18px;">${content.title}</p>
              </div>

              <p style="font-size: 14px; color: #666;">We'll notify you once the review is complete.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${contentUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">View My Content</a>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${content.createdBy.name || content.createdBy.email},

Your content is now being reviewed by a ${reviewerType.toLowerCase()} reviewer:

Title: ${content.title}

We'll notify you once the review is complete.

View your content: ${contentUrl}
      `.trim(),
    });

    await logAudit({
      organizationId: content.organizationId,
      userId: null,
      action: "notify",
      resource: "review",
      resourceId: contentId,
      metadata: {
        notificationType: "review_started",
        recipient: content.createdBy.email,
        reviewerType,
      },
    });
  } catch (error) {
    logger.error("Error notifying creator:", error);
  }
}

/**
 * Notify creator of review decision
 */
export async function notifyCreatorOfDecision(
  contentId: string,
  decision: {
    decision: string;
    reviewerType: ReviewerType;
    comment?: string | null;
  }
): Promise<void> {
  try {
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!content) {
      logger.error("Content not found for notification");
      return;
    }

    const contentUrl = `${BASE_URL}/dashboard/content/list`;
    const isApproved = decision.decision === "APPROVED";
    const isRejected = decision.decision === "REJECTED";
    const changesRequested = decision.decision === "CHANGES_REQUESTED";

    const statusColor = isApproved
      ? "#10b981"
      : isRejected
      ? "#ef4444"
      : "#f59e0b";
    const statusText = isApproved
      ? "approved"
      : isRejected
      ? "not approved"
      : "needs changes";

    await sendEmail({
      to: content.createdBy.email,
      subject: `Review ${statusText} - ${content.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Review Decision</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${statusColor}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Review ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${content.createdBy.name || content.createdBy.email},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">Your content has been reviewed by a ${decision.reviewerType.toLowerCase()} reviewer:</p>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; font-size: 18px;">${content.title}</p>
                <p style="margin: 10px 0 0 0; color: ${statusColor}; font-weight: 600;">Status: ${decision.decision.replace("_", " ")}</p>
              </div>

              ${decision.comment ? `
                <div style="border-left: 4px solid ${statusColor}; padding-left: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: 600; color: #666;">Reviewer Comment:</p>
                  <p style="margin: 5px 0 0 0;">${decision.comment}</p>
                </div>
              ` : ''}

              ${changesRequested ? `
                <p style="font-size: 14px; color: #666;">Please make the requested changes and resubmit your content for review.</p>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${contentUrl}" style="background: ${statusColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">${changesRequested ? 'Edit Content' : 'View My Content'}</a>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${content.createdBy.name || content.createdBy.email},

Your content has been reviewed by a ${decision.reviewerType.toLowerCase()} reviewer:

Title: ${content.title}
Status: ${decision.decision.replace("_", " ")}

${decision.comment ? `Reviewer Comment:\n${decision.comment}\n` : ''}

${changesRequested ? 'Please make the requested changes and resubmit your content for review.' : ''}

View your content: ${contentUrl}
      `.trim(),
    });

    await logAudit({
      organizationId: content.organizationId,
      userId: null,
      action: "notify",
      resource: "review",
      resourceId: contentId,
      metadata: {
        notificationType: "review_decision",
        recipient: content.createdBy.email,
        decision: decision.decision,
        reviewerType: decision.reviewerType,
      },
    });
  } catch (error) {
    logger.error("Error notifying creator of decision:", error);
  }
}
