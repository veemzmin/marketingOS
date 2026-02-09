"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobStatus, cancelJob } from "@/lib/actions/generation";

interface JobStatusProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function JobStatus({ jobId, onComplete, onError }: JobStatusProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchStatus() {
      const result = await getJobStatus(jobId);
      if (result.success) {
        setJob(result.data);
        setLoading(false);

        // Stop polling if job is complete or failed
        if (result.data?.status === "COMPLETED") {
          clearInterval(interval);
          if (onComplete) {
            onComplete(result.data.result);
          }
        } else if (result.data?.status === "FAILED") {
          clearInterval(interval);
          if (onError) {
            onError(result.data.error || "Job failed");
          }
        }
      } else {
        setLoading(false);
        if (onError) {
          onError(result.error || "Unknown error");
        }
      }
    }

    fetchStatus();

    // Poll every 2 seconds if job is not complete
    interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete, onError]);

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelJob(jobId);
    setCancelling(false);

    if (result.success) {
      // Refresh status
      const statusResult = await getJobStatus(jobId);
      if (statusResult.success) {
        setJob(statusResult.data);
      }
    } else {
      alert(result.error || "Failed to cancel job");
    }
  }

  if (loading || !job) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-muted-foreground">Loading job status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColorMap: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-800",
    DISPATCHED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  const statusColor = statusColorMap[job.status] || "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Generation Job</CardTitle>
          <Badge className={statusColor}>{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Type</div>
          <div className="font-medium">{job.jobType.replace("_", " ")}</div>
        </div>

        {job.status === "PROCESSING" && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-muted-foreground">
              {job.jobType.includes("VIDEO")
                ? "Generating video (this may take a few minutes)..."
                : "Processing..."}
            </span>
          </div>
        )}

        {job.status === "FAILED" && job.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-900 font-medium">Error</div>
            <div className="text-sm text-red-700 mt-1">{job.error}</div>
          </div>
        )}

        {job.status === "COMPLETED" && job.result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-900 font-medium">
              Generation Complete
            </div>
            <div className="text-sm text-green-700 mt-1">
              Result received successfully
            </div>
          </div>
        )}

        {(job.status === "PENDING" || job.status === "DISPATCHED") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Job"}
          </Button>
        )}

        <div className="text-xs text-muted-foreground">
          Created: {new Date(job.createdAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
