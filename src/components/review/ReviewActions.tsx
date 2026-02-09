"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitDecision } from "@/lib/actions/review";
import { logger } from "@/lib/logger";

interface ReviewActionsProps {
  assignmentId: string;
  existingDecision?: {
    id: string;
    decision: string;
    comment: string | null;
    createdAt: Date;
    reviewedBy: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

export function ReviewActions({
  assignmentId,
  existingDecision,
}: ReviewActionsProps) {
  type ReviewDecisionValue = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

  const router = useRouter();
  const [selectedDecision, setSelectedDecision] =
    useState<ReviewDecisionValue | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedDecision) {
      alert("Please select a decision");
      return;
    }

    if (
      (selectedDecision === "REJECTED" ||
        selectedDecision === "CHANGES_REQUESTED") &&
      !comment.trim()
    ) {
      alert("Comment is required when rejecting or requesting changes");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitDecision({
        assignmentId,
        decision: selectedDecision,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        alert("Review submitted successfully");
        router.push("/dashboard/reviews");
        router.refresh();
      } else {
        alert(result.error || "Failed to submit review");
      }
    } catch (error) {
      logger.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (existingDecision) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Decision</div>
              <div className="font-medium">
                {existingDecision.decision.replace("_", " ")}
              </div>
            </div>
            {existingDecision.comment && (
              <div>
                <div className="text-sm text-muted-foreground">Comment</div>
                <div className="text-sm">{existingDecision.comment}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Reviewed by</div>
              <div className="text-sm">
                {existingDecision.reviewedBy.name ||
                  existingDecision.reviewedBy.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={() => setSelectedDecision("APPROVED")}
            variant={selectedDecision === "APPROVED" ? "default" : "outline"}
            className="w-full justify-start"
          >
            <span className="mr-2">✓</span>
            Approve
          </Button>
          <Button
            onClick={() => setSelectedDecision("CHANGES_REQUESTED")}
            variant={
              selectedDecision === "CHANGES_REQUESTED" ? "default" : "outline"
            }
            className="w-full justify-start"
          >
            <span className="mr-2">↻</span>
            Request Changes
          </Button>
          <Button
            onClick={() => setSelectedDecision("REJECTED")}
            variant={selectedDecision === "REJECTED" ? "destructive" : "outline"}
            className="w-full justify-start"
          >
            <span className="mr-2">✗</span>
            Reject
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Comment
            {(selectedDecision === "REJECTED" ||
              selectedDecision === "CHANGES_REQUESTED") && (
              <span className="text-red-600 ml-1">*</span>
            )}
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              selectedDecision === "APPROVED"
                ? "Optional comment..."
                : "Explain your decision..."
            }
            rows={4}
            className="w-full"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedDecision || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
