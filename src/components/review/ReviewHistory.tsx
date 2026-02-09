import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ReviewHistoryProps {
  submission?: {
    submittedBy?: { name: string | null; email: string } | null
    submittedAt?: Date | null
    submittedFromStatus?: string | null
  }
  decisions: Array<{
    id: string;
    reviewerType: string;
    decision: string;
    comment: string | null;
    createdAt: Date;
    reviewedBy: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export function ReviewHistory({ decisions, submission }: ReviewHistoryProps) {
  if (decisions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review History</CardTitle>
      </CardHeader>
      <CardContent>
        {submission && (
          <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Submitted By</div>
                <div className="font-medium">
                  {submission.submittedBy
                    ? submission.submittedBy.name || submission.submittedBy.email
                    : "Unknown"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Submitted At</div>
                <div className="font-medium">
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleString()
                    : "Not submitted"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status At Submit</div>
                <div className="font-medium">
                  {submission.submittedFromStatus || "Unknown"}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="border-l-4 pl-4 py-2"
              style={{
                borderColor:
                  decision.decision === "APPROVED"
                    ? "#10b981"
                    : decision.decision === "REJECTED"
                    ? "#ef4444"
                    : "#f59e0b",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">
                    {decision.reviewedBy.name || decision.reviewedBy.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(decision.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      decision.decision === "APPROVED"
                        ? "default"
                        : decision.decision === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {decision.decision.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline">{decision.reviewerType}</Badge>
                </div>
              </div>
              {decision.comment && (
                <div className="text-sm bg-gray-50 p-3 rounded-md mt-2">
                  {decision.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
