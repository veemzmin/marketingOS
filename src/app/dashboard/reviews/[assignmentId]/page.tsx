import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/review/ReviewActions";
import { ContentWithViolations } from "@/components/review/ContentWithViolations";
import { ReviewHistory } from "@/components/review/ReviewHistory";
import { formatDistanceToNow } from "date-fns";
import { validateContentWithContext } from "@/lib/governance/engine";

export default async function ReviewAssignmentPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const assignment = await db.reviewAssignment.findUnique({
    where: { id: params.assignmentId },
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
          reviewDecisions: {
            include: {
              reviewedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      contentVersion: {
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!assignment) {
    redirect("/dashboard/reviews");
  }

  // Verify user is assigned to this review
  if (
    assignment.assignedUserId !== user.id &&
    assignment.status !== "PENDING"
  ) {
    redirect("/dashboard/reviews");
  }

  const latestVersion =
    assignment.contentVersion || assignment.content.versions[0];
  const existingDecision = assignment.content.reviewDecisions.find(
    (d) => d.reviewerType === assignment.reviewerType
  );

  const storedViolations = Array.isArray(
    latestVersion?.governanceViolations
  )
    ? latestVersion?.governanceViolations
    : null;

  const violationsForReview = storedViolations
    ? storedViolations.map((violation) => ({
        type: String((violation as { policyId?: string }).policyId || "policy"),
        severity: (violation as { severity?: "high" | "medium" | "low" })
          .severity || "medium",
        message: String(
          (violation as { explanation?: string }).explanation ||
            "Policy violation"
        ),
        matchedText: (violation as { text?: string }).text,
      }))
    : latestVersion?.body
    ? (
        await validateContentWithContext(latestVersion.body, {
          campaignId: assignment.content.campaignId ?? undefined,
          clientId: assignment.content.clientId ?? undefined,
        })
      ).violations.map((violation) => ({
        type: violation.policyId,
        severity: violation.severity,
        message: violation.explanation,
        matchedText: violation.text,
      }))
    : [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Content</h1>
        <p className="text-muted-foreground mt-2">
          Reviewing as {assignment.reviewerType.toLowerCase()} reviewer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-2xl">
                  {assignment.content.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Created by{" "}
                    {assignment.content.createdBy.name ||
                      assignment.content.createdBy.email}
                  </span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(assignment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {latestVersion && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{latestVersion.topic}</Badge>
                    <Badge variant="outline">{latestVersion.audience}</Badge>
                    <Badge variant="outline">{latestVersion.tone}</Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {latestVersion && (
                <ContentWithViolations
                  content={latestVersion.body}
                  violations={violationsForReview}
                />
              )}
            </CardContent>
          </Card>

          {/* Review History */}
          <ReviewHistory decisions={assignment.content.reviewDecisions} />
        </div>

        {/* Right column - Review Actions */}
        <div className="space-y-6">
          {/* Review Snapshot */}
          {latestVersion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">v{latestVersion.versionNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Captured</span>
                  <span className="font-medium">
                    {new Date(latestVersion.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted By</span>
                  <span className="font-medium">
                    {latestVersion.submittedBy
                      ? latestVersion.submittedBy.name ||
                        latestVersion.submittedBy.email
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted At</span>
                  <span className="font-medium">
                    {latestVersion.submittedAt
                      ? new Date(latestVersion.submittedAt).toLocaleString()
                      : "Not submitted"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status At Submit</span>
                  <span className="font-medium">
                    {latestVersion.submittedFromStatus || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Compliance</span>
                  <span className="font-medium">
                    {latestVersion.complianceScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Violations</span>
                  <span className="font-medium">{violationsForReview.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium">
                    {storedViolations ? "Stored snapshot" : "Re-validated"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Score */}
          {assignment.content.complianceScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div
                    className={`text-4xl font-bold ${
                      assignment.content.complianceScore >= 80
                        ? "text-green-600"
                        : assignment.content.complianceScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {assignment.content.complianceScore}
                  </div>
                  <span className="text-2xl text-muted-foreground ml-2">
                    / 100
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Policy Violations */}
          {violationsForReview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policy Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {violationsForReview.map((violation, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md bg-red-50 border-red-200"
                    >
                      <div className="font-medium text-sm text-red-900">
                        {violation.type}
                      </div>
                      <div className="text-xs text-red-700 mt-1">
                        {violation.message}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          <ReviewActions
            assignmentId={assignment.id}
            existingDecision={existingDecision}
          />
        </div>
      </div>
    </div>
  );
}
