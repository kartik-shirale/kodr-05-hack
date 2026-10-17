"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  HelpCircle,
  Loader2,
  Lock,
  Maximize2,
  Monitor,
  Phone,
  Send,
  ShieldAlert,
  Smartphone,
  Users,
  UserX,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import {
  startExamApi,
  getExamStatusApi,
  saveExamAnswerApi,
  submitExamApi,
  uploadExamEventApi,
} from "@/features/exam/api";
import type {
  ExamQuestionItem,
  ExamStartResponse,
  EventWarningResult,
} from "@/features/exam/schemas";
import { useCountdown } from "@/features/exam/hooks/use-countdown";
import { useTabVisibility } from "@/features/exam/hooks/use-tab-visibility";
import { useProctoring } from "@/features/exam/hooks/use-proctoring";
import { useFrameCapture } from "@/features/exam/hooks/use-frame-capture";
import { acquireNativeCamera, isExtendedDisplay } from "@/features/exam/lib/camera";
import { ExamTimer } from "@/features/exam/components/timer";
import { QuestionView } from "@/features/exam/components/question-view";
import { WarningDialog } from "@/features/exam/components/warning-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ExamRoomPage() {
  const router = useRouter();

  // Core exam data state
  const [examData, setExamData] = useState<ExamStartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers map: questionId -> selectedIndex
  const [answersMap, setAnswersMap] = useState<Record<string, number | null>>({});
  const [saveStatusMap, setSaveStatusMap] = useState<Record<string, "saved" | "saving" | "error">>({});

  // Webcam stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Warning state
  const [activeWarning, setActiveWarning] = useState<EventWarningResult | null>(null);

  // Submit confirmation dialog
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Offline detection
  const [isOffline, setIsOffline] = useState(false);

  // Camera state
  const [cameraOff, setCameraOff] = useState(false);
  const [cameraWarning, setCameraWarning] = useState<string | null>(null);

  // 6. Client-event dispatcher (snapshot-optional)
  const dispatchEvent = useCallback(
    async (
      type: string,
      durationMs?: number,
      snapshotBlob?: Blob,
      meta?: Record<string, unknown>
    ) => {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("occurredAt", new Date().toISOString());
      if (durationMs) formData.append("durationMs", String(durationMs));
      if (meta) formData.append("meta", JSON.stringify(meta));
      if (snapshotBlob) formData.append("snapshot", snapshotBlob, "evidence.jpg");

      try {
        const response = await uploadExamEventApi(formData);
        const warning = response.data?.warning;

        if (warning) {
          if (warning.terminated) {
            toast.error("Maximum warnings reached. Your exam has been terminated.");
            router.push("/exam/done");
          } else if (warning.counted) {
            setActiveWarning(warning);
          }
        }
      } catch {
        // Keep going; the queue/retry flow handles transient failures.
      }
    },
    [router]
  );

  // 7. Passive frame upload: a raw camera frame for server-side JEV analysis.
  const uploadFrame = useCallback(async (blob: Blob) => {
    const formData = new FormData();
    formData.append("occurredAt", new Date().toISOString());
    formData.append("snapshot", blob, "frame.jpg");
    try {
      await uploadExamEventApi(formData);
    } catch {
      // Ignore transient capture/upload errors.
    }
  }, []);

  // 8. Native camera lifecycle (guards against virtual cameras)
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const reportCameraOff = useCallback(() => {
    setCameraOff(true);
    void dispatchEvent("NO_FACE", 0, undefined, { reason: "camera_off" });
  }, [dispatchEvent]);

  const startCamera = useCallback(async () => {
    try {
      const probe = await acquireNativeCamera();
      stopCamera();
      streamRef.current = probe.stream;
      setMediaStream(probe.stream);
      if (videoRef.current) {
        videoRef.current.srcObject = probe.stream;
      }
      setCameraOff(false);
      setCameraWarning(probe.isNative ? null : probe.reason);

      const track = probe.stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener("ended", reportCameraOff);
        track.addEventListener("mute", reportCameraOff);
      }
    } catch (err) {
      reportCameraOff();
      setCameraWarning(
        err instanceof Error ? err.message : "Webcam is unavailable. Reconnect your camera to continue."
      );
    }
  }, [stopCamera, reportCameraOff]);

  // 1. Initialize Exam on mount
  const initExam = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await startExamApi();
      const data = response.data;
      setExamData(data);

      // Populate existing answers
      const initialAnswers: Record<string, number | null> = {};
      data.answers?.forEach((a) => {
        initialAnswers[a.questionId] = a.selectedIndex;
      });
      setAnswersMap(initialAnswers);
    } catch (err: any) {
      const code = err?.code;
      if (code === "ALREADY_SUBMITTED" || code === "SESSION_ENDED") {
        router.push("/exam/done");
      } else if (code === "CONSENT_REQUIRED" || code === "TEST_NOT_STARTED") {
        router.push("/exam/lobby");
      } else {
        setFetchError(err?.message || "Failed to load examination.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initExam();
  }, []);

  // 2. Initialize local webcam for proctoring
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // 2a. Bind the stream to the (lazily mounted) preview element.
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, examData]);

  // 2b. Keep trying to restore a lost camera feed.
  useEffect(() => {
    if (!cameraOff || !examData) return;
    const retry = setInterval(() => {
      startCamera();
    }, 4000);
    return () => clearInterval(retry);
  }, [cameraOff, examData, startCamera]);

  // 2c. Dual-monitor / extended-display detection.
  useEffect(() => {
    if (!examData) return;
    const check = () => {
      if (isExtendedDisplay()) {
        dispatchEvent("TAB_SWITCH", 0, undefined, { reason: "dual_monitor" });
      }
    };
    const initial = setTimeout(check, 0);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("focus", check);
    };
  }, [examData, dispatchEvent]);

  // 3. Online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 4. Auto-submit handler when timer runs out
  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await submitExamApi();
      router.push("/exam/done");
    } catch (err: any) {
      if (err?.code === "SESSION_ENDED" || err?.code === "ALREADY_SUBMITTED") {
        router.push("/exam/done");
      } else {
        toast.error("Failed to submit exam. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setSubmitDialogOpen(false);
    }
  }, [router]);

  // 5. Timer
  const { secondsRemaining, isLowTime } = useCountdown({
    endsAt: examData?.session?.endsAt || null,
    serverTime: examData?.serverTime,
    onTimeUp: () => {
      toast.warning("Time has expired! Automatically submitting your exam...");
      handleFinalSubmit();
    },
  });

  // Tab visibility detection
  useTabVisibility({
    enabled: Boolean(examData),
    onTabLeave: () => {
      dispatchEvent("TAB_SWITCH", 1500, undefined, { reason: "window_blur" });
    },
  });

  // Simulator hook
  const { simulateEvent, isSimulating } = useProctoring({
    onEvent: dispatchEvent,
    enabled: Boolean(examData),
  });

  // Random passive frame capture (every 1-5s) sent to the backend for JEV analysis.
  useFrameCapture({
    enabled: Boolean(examData) && !isSubmitting && !cameraOff,
    videoRef,
    onFrame: uploadFrame,
  });

  // 7. Answer Selection & Autosave
  const handleSelectOption = async (optionIndex: number) => {
    if (!examData) return;
    const currentQ = examData.questions[currentIndex];
    if (!currentQ) return;

    // Optimistically update
    setAnswersMap((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
    setSaveStatusMap((prev) => ({ ...prev, [currentQ.id]: "saving" }));

    try {
      await saveExamAnswerApi(currentQ.id, { selectedIndex: optionIndex });
      setSaveStatusMap((prev) => ({ ...prev, [currentQ.id]: "saved" }));
    } catch {
      setSaveStatusMap((prev) => ({ ...prev, [currentQ.id]: "error" }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Entering secure exam room...</p>
      </div>
    );
  }

  if (fetchError || !examData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 max-w-md mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="mt-1 flex items-center justify-between">
            <span>{fetchError}</span>
            <Button size="xs" variant="outline" onClick={initExam}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const questions = examData.questions || [];
  const currentQuestion: ExamQuestionItem | undefined = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answersMap).filter((v) => v !== null && v !== undefined).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background select-none">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="size-4 animate-pulse" />
          <span>You are currently offline. Answers are stored locally and will be synced upon reconnecting.</span>
        </div>
      )}

      {/* Camera Alert Banner */}
      {cameraOff && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Camera className="size-4 animate-pulse" />
          <span>Camera feed lost. Reconnect your webcam immediately — this violation is being recorded.</span>
        </div>
      )}

      {/* Virtual camera warning */}
      {cameraWarning && !cameraOff && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="size-4" />
          <span>{cameraWarning}</span>
        </div>
      )}

      {/* Top Proctored Exam Header */}
      <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
            EXAM
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground line-clamp-1">
              {examData.test.title}
            </h1>
            <span className="text-[11px] text-muted-foreground">
              {answeredCount} of {totalQuestions} Answered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Real-time Countdown Timer */}
          <ExamTimer secondsRemaining={secondsRemaining} isLowTime={isLowTime} />

          {/* Dev Simulator Button as specified in prompt */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="xs" variant="ghost" className="text-muted-foreground hover:text-foreground gap-1 border border-dashed text-[11px] h-7">
                  <Bug className="size-3" />
                  <span>Simulate Violation</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Dev Violation Simulator</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => simulateEvent("NO_FACE", videoRef.current)}>
                <UserX className="mr-2 size-3.5" /> No Face
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulateEvent("MULTIPLE_FACES", videoRef.current)}>
                <Users className="mr-2 size-3.5" /> Multiple Faces
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulateEvent("LOOKING_AWAY", videoRef.current)}>
                <EyeOff className="mr-2 size-3.5" /> Looking Away
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulateEvent("PHONE_DETECTED", videoRef.current)}>
                <Smartphone className="mr-2 size-3.5" /> Mobile Phone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => simulateEvent("TAB_SWITCH", videoRef.current)}>
                <Monitor className="mr-2 size-3.5" /> Tab Switch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Submit Exam Button */}
          <Button
            size="sm"
            onClick={() => setSubmitDialogOpen(true)}
            className="font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid gap-6 lg:grid-cols-4">
        {/* Left Column: Question Content */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <Card className="border-border/60 shadow-xs flex-1 flex flex-col justify-between">
            <CardContent className="p-6">
              {currentQuestion ? (
                <QuestionView
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalQuestions}
                  selectedIndex={answersMap[currentQuestion.id] ?? null}
                  onSelectOption={handleSelectOption}
                  saveStatus={saveStatusMap[currentQuestion.id]}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">No questions found.</div>
              )}
            </CardContent>

            {/* Navigation Buttons: Previous / Next */}
            <div className="border-t border-border/40 p-4 bg-muted/5 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="gap-1.5"
              >
                <ChevronLeft className="size-4" />
                <span>Previous</span>
              </Button>

              <div className="text-xs text-muted-foreground font-medium">
                {currentIndex + 1} / {totalQuestions}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Question Grid Palette & Camera PIP */}
        <div className="space-y-6">
          {/* Floating Camera Preview PIP */}
          <Card className="border-border/60 overflow-hidden shadow-xs">
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>REC</span>
              </div>
            </div>
          </Card>

          {/* Question Palette Grid */}
          <Card className="border-border/60 shadow-xs">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground border-b border-border/40 pb-2">
                <span>Question Palette</span>
                <span className="text-muted-foreground font-normal">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = answersMap[q.id] !== null && answersMap[q.id] !== undefined;

                  return (
                    <Button
                      key={q.id || idx}
                      size="icon"
                      variant={isAnswered ? "default" : "outline"}
                      className={cn(
                        "size-9 text-xs font-bold transition-all",
                        isAnswered && !isCurrent && "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
                        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background font-extrabold"
                      )}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-600" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-border" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border-2 border-primary" />
                  <span>Current</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning Alert Dialog */}
      {activeWarning && (
        <WarningDialog
          open={Boolean(activeWarning)}
          warningNumber={activeWarning.number}
          maxWarnings={activeWarning.max}
          onAcknowledge={() => setActiveWarning(null)}
        />
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Examination?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm pt-1">
              <p>Are you sure you want to finalize and submit your assessment?</p>
              {unansweredCount > 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-900 dark:text-amber-200 text-xs font-medium">
                  Notice: You have <strong>{unansweredCount} unanswered question(s)</strong> remaining. Once submitted, your answers cannot be altered.
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  All {totalQuestions} questions have been answered.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Continue Testing</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleFinalSubmit();
              }}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Yes, Submit Exam"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
