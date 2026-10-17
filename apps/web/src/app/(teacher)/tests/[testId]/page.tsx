"use client";

import React, { Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, AlertCircle, Sliders, Users } from "lucide-react";

import { useTest } from "@/features/tests/hooks/use-test";
import { TestHeader } from "@/features/tests/components/test-header";
import { StudentsTab } from "@/features/tests/components/students-tab";
import { SessionsTab } from "@/features/tests/components/sessions-tab";
import { TuningTab } from "@/features/tests/components/tuning-tab";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function TestDetailContent({ testId }: { testId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "students";
  // Normalize rules/tuning
  const activeTab = currentTab === "tuning" ? "rules" : currentTab;

  const { data: test, isLoading, isError, error, refetch } = useTest(testId);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/tests/${testId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="max-w-7xl mx-auto py-8">
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <TestHeader test={test} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-[480px]">
          <TabsTrigger value="students" className="gap-2">
            <Users className="size-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Activity className="size-4" />
            <span>Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Sliders className="size-4" />
            <span>Tuning</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="outline-none focus:ring-0">
          <StudentsTab test={test} />
        </TabsContent>

        <TabsContent value="sessions" className="outline-none focus:ring-0">
          <SessionsTab testId={testId} />
        </TabsContent>

        <TabsContent value="rules" className="outline-none focus:ring-0">
          <TuningTab testId={testId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const resolvedParams = use(params);
  const testId = resolvedParams.testId;

  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <TestDetailContent testId={testId} />
    </Suspense>
  );
}
