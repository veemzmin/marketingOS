"use server";

import { db } from "@/lib/db";
import { dispatchToN8n } from "./client";
import { GenerationJobType, GenerationJobStatus } from "@/lib/db/types";

const CALLBACK_URL = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/n8n/callback`;

export interface DispatchJobParams {
  organizationId: string;
  contentId?: string;
  jobType: GenerationJobType;
  prompt: string;
  parameters: Record<string, any>;
}

/**
 * Create and dispatch a generation job to n8n
 */
export async function dispatchJob(
  params: DispatchJobParams
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Create job record
    const job = await db.generationJob.create({
      data: {
        organizationId: params.organizationId,
        contentId: params.contentId,
        jobType: params.jobType,
        prompt: params.prompt,
        parameters: params.parameters,
        status: "PENDING",
      },
    });

    // Dispatch to n8n
    const result = await dispatchToN8n({
      jobId: job.id,
      organizationId: params.organizationId,
      jobType: params.jobType,
      prompt: params.prompt,
      parameters: params.parameters,
      callbackUrl: CALLBACK_URL,
    });

    if (result.success) {
      // Update job status to DISPATCHED
      await db.generationJob.update({
        where: { id: job.id },
        data: {
          status: "DISPATCHED",
          n8nExecutionId: result.executionId,
        },
      });

      return { success: true, jobId: job.id };
    } else {
      // Mark job as failed
      await db.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: result.error || "Failed to dispatch to n8n",
        },
      });

      return {
        success: false,
        error: result.error || "Failed to dispatch to n8n",
      };
    }
  } catch (error) {
    console.error("Error dispatching job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Retry failed jobs (can be run as cron job)
 */
export async function retryFailedJobs(): Promise<{
  retriedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let retriedCount = 0;

  try {
    // Find PENDING jobs older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const pendingJobs = await db.generationJob.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: fiveMinutesAgo,
        },
      },
    });

    for (const job of pendingJobs) {
      try {
        const result = await dispatchToN8n({
          jobId: job.id,
          organizationId: job.organizationId,
          jobType: job.jobType,
          prompt: job.prompt,
          parameters: job.parameters as Record<string, any>,
          callbackUrl: CALLBACK_URL,
        });

        if (result.success) {
          await db.generationJob.update({
            where: { id: job.id },
            data: {
              status: "DISPATCHED",
              n8nExecutionId: result.executionId,
            },
          });
          retriedCount++;
        } else {
          // Mark as failed after retry
          await db.generationJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              error: `Retry failed: ${result.error}`,
            },
          });
          errors.push(`Job ${job.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Job ${job.id}: ${errorMsg}`);
      }
    }

    return { retriedCount, errors };
  } catch (error) {
    console.error("Error retrying failed jobs:", error);
    return {
      retriedCount,
      errors: [
        ...errors,
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }
}
