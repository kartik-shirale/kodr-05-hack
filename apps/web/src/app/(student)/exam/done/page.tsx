"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, LogOut, ShieldCheck } from "lucide-react";

import { getExamStatusApi } from "@/features/exam/api";
import type { ExamStatusResponse } from "@/features/exam/schemas";
import { useLogout } from "@/features/auth/hooks/use-logout";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

export default function ExamDonePage() {
  const [statusData, setStatusData] = useState<ExamStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutMutation = useLogout();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getExamStatusApi();
        setStatusData(response.data);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <Skeleton className="size-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </Card>
      </div>
    );
  }

  const isAutoSubmitted = statusData?.status === "AUTO_SUBMITTED";

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-lg shadow-sm border-border/60 text-center">
        <CardHeader className="space-y-3 pb-4">
          <div
            className={cn(
              "size-14 rounded-full flex items-center justify-center mx-auto shadow-xs",
              isAutoSubmitted
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600"
            )}
          >
            {isAutoSubmitted ? (
              <AlertTriangle className="size-8" />
            ) : (
              <CheckCircle2 className="size-8" />
            )}
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {isAutoSubmitted ? "Exam Concluded" : "Exam Successfully Submitted"}
          </CardTitle>

          <CardDescription className="text-sm max-w-md mx-auto leading-relaxed">
            {isAutoSubmitted
              ? "Your assessment has ended and your responses have been recorded."
              : "Thank you for completing your assessment. Your responses have been securely received and recorded for grading."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="p-4 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground space-y-1.5 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
              <span>Recorded Status:</span>
              <span className="font-semibold text-foreground">
                {statusData?.status ? statusData.status.replace("_", " ") : "SUBMITTED"}
              </span>
            </div>
            {statusData?.serverTime && (
              <div className="flex items-center justify-between">
                <span>Completed At:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(statusData.serverTime), "PPp")}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your instructor will review the session and publish grades when ready. You may now safely close this window.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/40 p-5 bg-muted/5">
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            className="gap-2"
          >
            <LogOut className="size-4" />
            <span>Sign Out & Close</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
