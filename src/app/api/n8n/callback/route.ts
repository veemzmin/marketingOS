import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify callback signature (shared secret)
    const authHeader = req.headers.get("authorization");
    if (N8N_CALLBACK_SECRET && authHeader !== `Bearer ${N8N_CALLBACK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, status, result, error } = body;

    if (!jobId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, status" },
        { status: 400 }
      );
    }

    // Get the job
    const job = await db.generationJob.findUnique({
      where: { id: jobId },
      include: {
        content: true,
        organization: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update job based on status
    if (status === "completed") {
      await db.generationJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          result: result || {},
          completedAt: new Date(),
        },
      });

      // If job is attached to content, optionally update content with result
      // This logic can be expanded based on needs
      if (job.contentId && result?.content) {
        // Example: Update content body if it's text generation
        if (job.jobType === "TEXT_BLOG" || job.jobType === "TEXT_SOCIAL") {
          // You might want to create a new version or update draft
          // For now, we'll just log it
          logger.info(
            `Job ${jobId} completed for content ${job.contentId}:`,
            result
          );
        }
      }

      // Log to audit
      await logAudit({
        organizationId: job.organizationId,
        userId: null,
        action: "complete",
        resource: "generation_job",
        resourceId: jobId,
        metadata: {
          jobType: job.jobType,
          resultKeys: result ? Object.keys(result) : [],
        },
      });

      return NextResponse.json({
        success: true,
        message: "Job completed successfully",
      });
    } else if (status === "failed") {
      await db.generationJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: error || "Unknown error from n8n",
          completedAt: new Date(),
        },
      });

      // Log to audit
      await logAudit({
        organizationId: job.organizationId,
        userId: null,
        action: "fail",
        resource: "generation_job",
        resourceId: jobId,
        metadata: {
          jobType: job.jobType,
          error,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Job failure recorded",
      });
    } else if (status === "processing") {
      await db.generationJob.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Job processing status updated",
      });
    } else {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Error processing n8n callback:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
