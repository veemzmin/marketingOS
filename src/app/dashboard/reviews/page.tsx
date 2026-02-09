import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import {
  getReviewQueue,
  getMyAssignedReviews,
  getMyCompletedReviews,
} from "@/lib/actions/review";
import { ReviewQueueItem } from "@/components/review/ReviewQueueItem";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review content submissions for approval
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="my-reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <Suspense fallback={<ReviewQueueSkeleton />}>
            <AvailableReviews />
          </Suspense>
        </TabsContent>

        <TabsContent value="my-reviews" className="space-y-4">
          <Suspense fallback={<ReviewQueueSkeleton />}>
            <MyReviews />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Suspense fallback={<ReviewQueueSkeleton />}>
            <CompletedReviews />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function AvailableReviews() {
  const result = await getReviewQueue();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const assignments = result.data ?? [];

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No reviews available at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <ReviewQueueItem
          key={assignment.id}
          assignment={assignment}
          mode="claim"
        />
      ))}
    </div>
  );
}

async function MyReviews() {
  const result = await getMyAssignedReviews();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const assignments = result.data ?? [];

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            You have no active reviews
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <ReviewQueueItem
          key={assignment.id}
          assignment={assignment}
          mode="review"
        />
      ))}
    </div>
  );
}

async function CompletedReviews() {
  const result = await getMyCompletedReviews();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const decisions = result.data ?? [];

  if (decisions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            You have not completed any reviews yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {decisions.map((decision) => (
        <Card key={decision.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{decision.content.title}</CardTitle>
                <CardDescription>
                  Created by {decision.content.createdBy.name || decision.content.createdBy.email}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  decision.decision === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : decision.decision === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {decision.decision.replace("_", " ")}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {decision.reviewerType}
                </span>
              </div>
            </div>
          </CardHeader>
          {decision.comment && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{decision.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function ReviewQueueSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
