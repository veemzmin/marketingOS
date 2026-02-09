"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { dispatchJob } from "@/lib/n8n/dispatch";
import { GenerationJobType, GenerationJobStatus } from "@/lib/db/types";
import { buildCampaignPrompt } from "@/lib/campaign/engine";
import type { PromptContext } from "@/lib/ai/prompt-builder";
import { logger } from "@/lib/logger";

export type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create and dispatch a generation job
 */
export async function createGenerationJob(data: {
  contentId?: string;
  jobType: GenerationJobType;
  prompt: string;
  parameters: Record<string, unknown>;
}): Promise<Result<{ jobId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's organization
    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      return { success: false, error: "No organization found" };
    }

    // If contentId provided, verify user has access
    if (data.contentId) {
      const content = await db.content.findUnique({
        where: { id: data.contentId },
      });

      if (!content) {
        return { success: false, error: "Content not found" };
      }

      if (content.organizationId !== userOrg.organizationId) {
        return { success: false, error: "Access denied" };
      }
    }

    // Dispatch job
    const result = await dispatchJob({
      organizationId: userOrg.organizationId,
      contentId: data.contentId,
      jobType: data.jobType,
      prompt: data.prompt,
      parameters: data.parameters,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to create job" };
    }

    revalidatePath("/dashboard/content/generate");

    return { success: true, data: { jobId: result.jobId! } };
  } catch (error) {
    logger.error("Error creating generation job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a campaign-aware generation job using templates and governance context
 */
export async function createCampaignGenerationJob(data: {
  campaignId: string;
  templateId?: string;
  contentId?: string;
  context: PromptContext;
  parameters?: Record<string, unknown>;
}): Promise<Result<{ jobId: string }>> {
  try {
    const { prompt, template } = await buildCampaignPrompt({
      campaignId: data.campaignId,
      templateId: data.templateId,
      context: data.context,
    });

    const jobType =
      template?.contentType === "blog"
        ? GenerationJobType.TEXT_BLOG
        : GenerationJobType.TEXT_SOCIAL;

    return createGenerationJob({
      contentId: data.contentId,
      jobType,
      prompt,
      parameters: {
        campaignId: data.campaignId,
        templateId: data.templateId,
        contentType: template?.contentType,
        platform: template?.platform,
        ...data.parameters,
      },
    });
  } catch (error) {
    logger.error("Error creating campaign generation job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create campaign job",
    };
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      return { success: false, error: "No organization found" };
    }

    const job = await db.generationJob.findUnique({
      where: {
        id: jobId,
        organizationId: userOrg.organizationId,
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    return { success: true, data: job };
  } catch (error) {
    logger.error("Error getting job status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all jobs for a content item
 */
export async function getContentJobs(contentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized", jobs: [] };
    }

    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      return { success: false, error: "No organization found", jobs: [] };
    }

    const jobs = await db.generationJob.findMany({
      where: {
        contentId,
        organizationId: userOrg.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: jobs };
  } catch (error) {
    logger.error("Error getting content jobs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      jobs: [],
    };
  }
}

/**
 * Get all jobs for current organization
 */
export async function getOrganizationJobs(filters?: {
  jobType?: GenerationJobType;
  status?: GenerationJobStatus;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized", jobs: [] };
    }

    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      return { success: false, error: "No organization found", jobs: [] };
    }

    const jobs = await db.generationJob.findMany({
      where: {
        organizationId: userOrg.organizationId,
        ...(filters?.jobType && { jobType: filters.jobType }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters?.limit || 50,
    });

    return { success: true, data: jobs };
  } catch (error) {
    logger.error("Error getting organization jobs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      jobs: [],
    };
  }
}

/**
 * Cancel a pending job
 */
export async function cancelJob(jobId: string): Promise<Result> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userOrg = user.userOrganizations[0];
    if (!userOrg) {
      return { success: false, error: "No organization found" };
    }

    const job = await db.generationJob.findUnique({
      where: {
        id: jobId,
        organizationId: userOrg.organizationId,
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    if (job.status !== "PENDING" && job.status !== "DISPATCHED") {
      return { success: false, error: "Can only cancel pending or dispatched jobs" };
    }

    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: "Cancelled by user",
      },
    });

    revalidatePath("/dashboard/content/generate");

    return { success: true, data: undefined };
  } catch (error) {
    logger.error("Error cancelling job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
