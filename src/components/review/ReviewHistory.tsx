import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ReviewHistoryProps {
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

export function ReviewHistory({ decisions }: ReviewHistoryProps) {
  if (decisions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review History</CardTitle>
      </CardHeader>
      <CardContent>
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
