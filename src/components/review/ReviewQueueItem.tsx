"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { claimReview } from "@/lib/actions/review";
import { formatDistanceToNow } from "date-fns";

interface ReviewQueueItemProps {
  assignment: {
    id: string;
    reviewerType: string;
    createdAt: Date;
    content: {
      id: string;
      title: string;
      complianceScore: number | null;
      createdBy: {
        id: string;
        name: string | null;
        email: string;
      };
      versions: Array<{
        id: string;
        body: string;
        topic: string;
        audience: string;
        tone: string;
      }>;
    };
  };
  mode: "claim" | "review";
}

export function ReviewQueueItem({ assignment, mode }: ReviewQueueItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const latestVersion = assignment.content.versions[0];

  async function handleClaim() {
    setIsLoading(true);
    try {
      const result = await claimReview(assignment.id);
      if (result.success) {
        router.push(`/dashboard/reviews/${assignment.id}`);
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error claiming review:", error);
      alert("Failed to claim review");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReview() {
    router.push(`/dashboard/reviews/${assignment.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{assignment.content.title}</CardTitle>
            <CardDescription className="mt-1">
              Created by {assignment.content.createdBy.name || assignment.content.createdBy.email}
              {" · "}
              {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant={assignment.reviewerType === "CLINICAL" ? "destructive" : "default"}>
              {assignment.reviewerType}
            </Badge>
            {assignment.content.complianceScore !== null && (
              <Badge
                variant={
                  assignment.content.complianceScore >= 80
                    ? "default"
                    : assignment.content.complianceScore >= 70
                    ? "secondary"
                    : "destructive"
                }
              >
                Score: {assignment.content.complianceScore}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {latestVersion && (
            <>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {latestVersion.body.substring(0, 200)}
                {latestVersion.body.length > 200 && "..."}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Topic:</span>
                <Badge variant="outline">{latestVersion.topic}</Badge>
                <span className="text-muted-foreground">Audience:</span>
                <Badge variant="outline">{latestVersion.audience}</Badge>
                <span className="text-muted-foreground">Tone:</span>
                <Badge variant="outline">{latestVersion.tone}</Badge>
              </div>
            </>
          )}
          <div className="flex justify-end">
            {mode === "claim" ? (
              <Button onClick={handleClaim} disabled={isLoading}>
                {isLoading ? "Claiming..." : "Claim Review"}
              </Button>
            ) : (
              <Button onClick={handleReview}>Review Content</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
