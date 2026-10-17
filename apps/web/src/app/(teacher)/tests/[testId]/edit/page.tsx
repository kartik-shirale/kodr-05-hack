"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useTest } from "@/features/tests/hooks/use-test";
import { TestForm } from "@/features/tests/components/test-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function EditTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const resolvedParams = use(params);
  const testId = resolvedParams.testId;

  const { data: test, isLoading, isError, error, refetch } = useTest(testId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error loading test</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>{(error as any)?.message || "Failed to load test details."}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/tests/${testId}`}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Back to Test</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Test</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Modify question sets, policy settings, or schedule for &quot;{test.title}&quot;.
          </p>
        </div>
      </div>

      <TestForm initialData={test} testId={testId} />
    </div>
  );
}
