import { GenerationJobType } from "@/lib/db/types";

const N8N_WEBHOOK_BASE =
  process.env.N8N_WEBHOOK_URL || "https://n8n.srv1221317.hstgr.cloud/webhook";

// Webhook endpoints by job type
const WEBHOOKS: Record<GenerationJobType, string> = {
  TEXT_BLOG: "/marketing-os-blog",
  TEXT_SOCIAL: "/marketing-os-social",
  IMAGE: "/marketing-os-image",
  VIDEO: "/marketing-os-video",
};

export interface N8nJobPayload {
  jobId: string;
  organizationId: string;
  jobType: GenerationJobType;
  prompt: string;
  parameters: Record<string, any>;
  callbackUrl: string;
}

export interface N8nResponse {
  success: boolean;
  executionId?: string;
  error?: string;
}

/**
 * Dispatch a generation job to n8n
 */
export async function dispatchToN8n(
  payload: N8nJobPayload
): Promise<N8nResponse> {
  const webhookUrl = `${N8N_WEBHOOK_BASE}${WEBHOOKS[payload.jobType]}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      executionId: data.executionId || data.workflowId || undefined,
    };
  } catch (error) {
    console.error("Error dispatching to n8n:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check job status (polling fallback if callback doesn't work)
 */
export async function getN8nExecutionStatus(
  executionId: string
): Promise<{ status: string; result?: any; error?: string }> {
  // This would require n8n API credentials
  // For now, we rely on callbacks
  console.warn("Status polling not implemented, use callbacks instead");
  return {
    status: "unknown",
    error: "Status polling not available, use callback mechanism",
  };
}
