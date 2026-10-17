"use client";

import React, { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, formatDistanceStrict } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Maximize2,
  Monitor,
  Phone,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { useSession } from "@/features/sessions/hooks/use-session";
import { useReviewEvent } from "@/features/sessions/hooks/use-review-event";
import { getEventSnapshotUrl } from "@/features/sessions/api";
import type { SessionEventItem } from "@/features/sessions/schemas";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SessionReviewContent({
  testId,
  examSessionId,
}: {
  testId: string;
  examSessionId: string;
}) {
  const searchParams = useSearchParams();
  const highlightedEventId = searchParams.get("event");

  const { data: sessionData, isLoading, isError, error, refetch } = useSession(examSessionId);
  const reviewMutation = useReviewEvent(examSessionId, testId);

  const [activeSnapshot, setActiveSnapshot] = useState<SessionEventItem | null>(null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto scroll to highlighted event if specified
  useEffect(() => {
    if (highlightedEventId && eventRefs.current[highlightedEventId]) {
      eventRefs.current[highlightedEventId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedEventId, sessionData]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !sessionData) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load session details</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>{(error as any)?.message || "Could not retrieve the exam session."}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { session, participant, events = [], answers = [] } = sessionData;

  const handleReview = (eventId: string, review: "VALID" | "FALSE_ALARM" | "PENDING") => {
    reviewMutation.mutate(
      { eventId, data: { review } },
      {
        onSuccess: () => {
          toast.success(`Event marked as ${review.replace("_", " ").toLowerCase()}`);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update review status.");
        },
      }
    );
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "NO_FACE":
        return <UserX className="size-4 text-amber-500" />;
      case "MULTIPLE_FACES":
        return <Users className="size-4 text-destructive" />;
      case "LOOKING_AWAY":
        return <EyeOff className="size-4 text-amber-500" />;
      case "PHONE_DETECTED":
        return <Smartphone className="size-4 text-destructive" />;
      case "TAB_SWITCH":
        return <Monitor className="size-4 text-destructive" />;
      default:
        return <AlertTriangle className="size-4 text-muted-foreground" />;
    }
  };

  const durationText = session.startedAt && session.submittedAt
    ? formatDistanceStrict(new Date(session.startedAt), new Date(session.submittedAt))
    : session.startedAt && session.endsAt
    ? formatDistanceStrict(new Date(session.startedAt), new Date(session.endsAt))
    : "In progress";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col gap-2">
        <Link
          href={`/tests/${testId}?tab=sessions`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Sessions</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Review: {participant.name}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {participant.email} • {participant.set?.name || "Set A"}
            </p>
          </div>

          <Badge variant="outline" className="w-fit text-xs px-3 py-1 bg-muted/30">
            Status: {session.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Score */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Final Exam Score</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {session.score !== undefined && session.score !== null ? `${session.score} pts` : "Ungraded"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {answers.filter((a) => a.correct).length} of {answers.length} questions correct
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card className={cn(
          "border-border/60",
          session.riskLevel === "HIGH" && "border-destructive/40 bg-destructive/5"
        )}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Proctoring Risk Score</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <span>{session.riskScore ?? 0}</span>
              {session.riskLevel === "HIGH" ? (
                <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground text-xs">
                  HIGH
                </Badge>
              ) : session.riskLevel === "MEDIUM" ? (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-semibold text-xs">
                  MEDIUM
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                  LOW
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {session.riskLevel === "HIGH" ? "Flagged for manual review" : "Within acceptable variance"}
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Counted Warnings</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {session.warningCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {session.endReason === "WARNING_LIMIT" ? "Terminated on warning limit" : "Warnings acknowledged"}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Session Duration</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {durationText}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {session.startedAt ? format(new Date(session.startedAt), "h:mm a") : "-"}
            {" → "}
            {session.submittedAt ? format(new Date(session.submittedAt), "h:mm a") : "Active"}
          </CardContent>
        </Card>
      </div>

      {/* Main Review Sections: Event Timeline & Answers Summary */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Event Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Proctoring Violations Timeline</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {events.length} flagged events
            </span>
          </div>

          {events.length === 0 ? (
            <Card className="border-dashed border-2 border-border/80 text-center py-12 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center space-y-2">
                <ShieldCheck className="size-8 text-emerald-500" />
                <h3 className="font-semibold text-sm">Clean Session</h3>
                <p className="text-xs text-muted-foreground">
                  No automated proctoring events or suspicious behavior flagged during this test.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const isHighlighted = highlightedEventId === event.id;
                const occurredTime = event.occurredAt
                  ? format(new Date(event.occurredAt), "h:mm:ss a")
                  : "-";
                const snapshotUrl = getEventSnapshotUrl(event.id);

                return (
                  <Card
                    key={event.id}
                    ref={(el) => {
                      eventRefs.current[event.id] = el;
                    }}
                    className={cn(
                      "border transition-all",
                      isHighlighted
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-border/60 hover:border-border",
                      event.review === "FALSE_ALARM" && "opacity-60 bg-muted/30"
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/30 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center">
                            {getEventIcon(event.type)}
                          </div>
                          <span className="font-semibold text-sm text-foreground">
                            {event.type.replace("_", " ")}
                          </span>

                          {event.countedAsWarning && (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0">
                              Warning {event.warningNumber || 1}
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-[10px] font-mono">
                            +{event.weight} pts
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <Clock className="size-3.5" />
                          <span>{occurredTime}</span>
                          {event.durationMs && (
                            <span>({(event.durationMs / 1000).toFixed(1)}s)</span>
                          )}
                        </div>
                      </div>

                      {/* Snapshot Thumbnail & Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                        {event.hasSnapshot ? (
                          <div
                            onClick={() => setActiveSnapshot(event)}
                            className="relative group cursor-pointer w-28 h-20 rounded-md overflow-hidden border border-border/60 bg-black/80 flex items-center justify-center shrink-0"
                          >
                            <img
                              src={snapshotUrl}
                              alt="Proctor snapshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1">
                              <Maximize2 className="size-3" />
                              <span>View</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                            <Camera className="size-3.5 opacity-50" />
                            <span>No snapshot captured</span>
                          </div>
                        )}

                        {/* Review Action Toggle Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <Button
                            size="xs"
                            variant={event.review === "VALID" ? "destructive" : "outline"}
                            className={cn(
                              "gap-1 text-xs",
                              event.review === "VALID" && "shadow-xs"
                            )}
                            onClick={() => handleReview(event.id, "VALID")}
                            disabled={reviewMutation.isPending}
                          >
                            <Check className="size-3" />
                            <span>Valid</span>
                          </Button>

                          <Button
                            size="xs"
                            variant={event.review === "FALSE_ALARM" ? "default" : "outline"}
                            className={cn(
                              "gap-1 text-xs",
                              event.review === "FALSE_ALARM" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                            onClick={() => handleReview(event.id, "FALSE_ALARM")}
                            disabled={reviewMutation.isPending}
                          >
                            <X className="size-3" />
                            <span>False Alarm</span>
                          </Button>

                          <Button
                            size="xs"
                            variant={event.review === "PENDING" ? "secondary" : "ghost"}
                            className="text-xs text-muted-foreground"
                            onClick={() => handleReview(event.id, "PENDING")}
                            disabled={reviewMutation.isPending}
                          >
                            Pending
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Answers Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Answers Summary</h2>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Submitted Responses</CardTitle>
              <CardDescription className="text-xs">
                Question responses and correctness verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {answers.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No answers submitted yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold py-2">Q#</TableHead>
                      <TableHead className="text-xs font-semibold py-2">Selected</TableHead>
                      <TableHead className="text-xs font-semibold py-2 text-right">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {answers.map((answer, index) => {
                      const selectedChar = answer.selectedIndex !== null && answer.selectedIndex !== undefined
                        ? String.fromCharCode(65 + answer.selectedIndex)
                        : "None";

                      return (
                        <TableRow key={answer.questionId || index} className="text-xs">
                          <TableCell className="font-medium py-2.5">
                            Q{index + 1}
                          </TableCell>
                          <TableCell className="font-mono py-2.5">
                            Option {selectedChar}
                          </TableCell>
                          <TableCell className="text-right py-2.5">
                            {answer.correct ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                                Correct
                              </Badge>
                            ) : answer.selectedIndex === null ? (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                Skipped
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Incorrect
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enlarged Snapshot Modal Dialog */}
      <Dialog open={Boolean(activeSnapshot)} onOpenChange={(open) => !open && setActiveSnapshot(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{activeSnapshot?.type.replace("_", " ")}</span>
              {activeSnapshot?.countedAsWarning && (
                <Badge variant="destructive" className="text-xs">
                  Warning {activeSnapshot.warningNumber || 1}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {activeSnapshot && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border/80 bg-black max-h-[60vh] flex items-center justify-center">
                <img
                  src={getEventSnapshotUrl(activeSnapshot.id)}
                  alt="Snapshot evidence"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Occurred: {format(new Date(activeSnapshot.occurredAt), "PPpp")}</span>
                <span>Weight: +{activeSnapshot.weight} pts</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SessionReviewPage({
  params,
}: {
  params: Promise<{ testId: string; examSessionId: string }>;
}) {
  const resolvedParams = use(params);
  const { testId, examSessionId } = resolvedParams;

  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <SessionReviewContent testId={testId} examSessionId={examSessionId} />
    </Suspense>
  );
}
