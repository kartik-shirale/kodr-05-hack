"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Play,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { useExamInfo } from "@/features/exam/hooks/use-exam-info";
import { submitConsentApi, startExamApi } from "@/features/exam/api";
import { CameraCheck } from "@/features/exam/components/camera-check";
import { useCountdown } from "@/features/exam/hooks/use-countdown";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ExamLobbyPage() {
  const router = useRouter();
  const { data: info, isLoading, isError, error, refetch } = useExamInfo();

  const [consentChecked, setConsentChecked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Sync initial consent if already given on backend
  useEffect(() => {
    if (info?.consentGiven) {
      setConsentChecked(true);
    }
  }, [info?.consentGiven]);

  // Route redirects based on session status
  useEffect(() => {
    if (info) {
      if (info.sessionStatus === "IN_PROGRESS") {
        router.push("/exam/room");
      } else if (
        info.sessionStatus === "SUBMITTED" ||
        info.sessionStatus === "AUTO_SUBMITTED"
      ) {
        router.push("/exam/done");
      }
    }
  }, [info, router]);

  // Real-time server-synced countdown until startsAt
  const { days, hours, minutes, seconds, remainingMs, isFinished } = useCountdown({
    targetIso: info?.test.startsAt || null,
    serverTime: info?.serverTime,
    onTimeUp: () => {
      refetch();
    },
  });

  const hasRefetchedOnFinished = useRef(false);
  useEffect(() => {
    if (isFinished && !hasRefetchedOnFinished.current) {
      hasRefetchedOnFinished.current = true;
      refetch();
    }
  }, [isFinished, refetch]);

  if (isLoading) {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !info) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full p-6 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load exam details</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>{(error as any)?.message || "Could not retrieve exam parameters."}</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { test, participant, policy, canStart } = info;

  const isStartButtonEnabled = (canStart || isFinished) && consentChecked && cameraReady;

  const handleStartExam = async () => {
    setIsStarting(true);
    try {
      // 1. Submit consent if not recorded yet
      if (!info.consentGiven) {
        await submitConsentApi({ accepted: true });
      }

      // 2. Start exam
      await startExamApi();
      toast.success("Exam started! Entering testing environment...");
      router.push("/exam/room");
    } catch (err: any) {
      const code = err?.code;
      if (code === "TEST_NOT_STARTED") {
        toast.error("The test has not yet reached its scheduled start time.");
      } else if (code === "CONSENT_REQUIRED") {
        toast.error("Consent agreement is required before starting.");
      } else if (code === "ALREADY_SUBMITTED") {
        router.push("/exam/done");
      } else {
        toast.error(err?.message || "Failed to start exam. Please try again.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
      {/* Test Title Header */}
      <div className="border-b border-border/50 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary text-xs font-semibold">
              Assessment Lobby
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Welcome, {participant.name} ({participant.email})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{test.description}</p>
          )}
        </div>

        {/* Schedule & Duration badge */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
            <Clock className="size-3.5 text-primary" />
            <span>Duration: <strong className="text-foreground">{test.durationMinutes} mins</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
            <Calendar className="size-3.5 text-primary" />
            <span>Starts: <strong className="text-foreground">{format(new Date(test.startsAt), "PPp")}</strong></span>
          </div>
        </div>
      </div>

      {/* Countdown to Start */}
      <Card className="border-primary/40 bg-primary/5 text-center p-6">
        <CardTitle className="text-sm uppercase tracking-wider text-primary font-semibold">
          {isFinished ? "Test Has Started" : "Test Starts In"}
        </CardTitle>
        <div className="text-4xl font-mono font-bold text-foreground mt-2 tabular-nums">
          {remainingMs === null ? (
            "--h --m --s"
          ) : (
            <>
              {days > 0 && `${days}d `}
              {hours}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
            </>
          )}
        </div>
        <CardDescription className="mt-2 text-xs">
          {isFinished
            ? "Complete the webcam check and consent below so you are ready to begin."
            : "Complete the webcam check and consent below so you are ready to begin as soon as the test opens."}
        </CardDescription>
      </Card>

      {/* Main Grid: Proctoring Rules & Camera Verification */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Proctoring Policy & Instructions */}
        <Card className="border-border/60 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              <CardTitle className="text-lg">Proctoring Rules & Instructions</CardTitle>
            </div>
            <CardDescription>
              Please read the examination code of conduct carefully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Full Screen Focus:</strong> Do not navigate away from the testing window or switch tabs. Window leaves are automatically flagged.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Camera Position:</strong> Ensure your face is centered, unobstructed, and well-lit. No other person may be present in the room.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Prohibited Devices:</strong> Mobile phones, earphones, and secondary monitors are strictly prohibited.
                </span>
              </div>

              {policy.warningsEnabled && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
                  <strong>Warning Policy:</strong> You will receive a maximum of{" "}
                  <strong>{policy.maxWarnings} warning(s)</strong> for violations.
                  {policy.autoSubmitOnLimit && (
                    <span> A further violation will immediately terminate and submit your assessment.</span>
                  )}
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(Boolean(checked))}
                />
                <label
                  htmlFor="consent"
                  className="text-xs font-medium text-foreground leading-snug cursor-pointer select-none"
                >
                  I acknowledge and agree to the proctoring rules, automated violation tracking, and testing guidelines.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Camera Verification Check */}
        <Card className="border-border/60 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="size-5 text-primary" />
              <CardTitle className="text-lg">Webcam Verification</CardTitle>
            </div>
            <CardDescription>
              Test your local camera stream to ensure you are ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CameraCheck onStatusChange={setCameraReady} />
          </CardContent>
          <CardFooter className="border-t border-border/40 p-4 bg-muted/5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {cameraReady ? "Camera verified" : "Camera required"}
            </span>
            {cameraReady && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                Ready
              </Badge>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Start Exam CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-border/60 bg-muted/20 shadow-xs">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="text-sm font-semibold text-foreground">Ready to begin?</span>
          <p className="text-xs text-muted-foreground">
            Once started, your exam timer will begin immediately and answers will autosave.
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleStartExam}
          disabled={!isStartButtonEnabled || isStarting}
          className="min-w-44 font-semibold shadow-sm gap-2"
        >
          {isStarting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Starting Exam...
            </>
          ) : (
            <>
              <Play className="size-4 fill-current" />
              Start Exam Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
