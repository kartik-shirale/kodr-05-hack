"use client";

import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "cn";

interface ExamTimerProps {
  secondsRemaining: number | null;
  isLowTime?: boolean;
}

export function ExamTimer({ secondsRemaining, isLowTime }: ExamTimerProps) {
  if (secondsRemaining === null) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
        <Clock className="size-4 animate-spin text-muted-foreground" />
        <span>Syncing timer...</span>
      </div>
    );
  }

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formatted = hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold transition-all shadow-2xs",
        isLowTime
          ? "border-destructive bg-destructive/10 text-destructive text-base animate-pulse"
          : "border-border/60 bg-muted/40 text-foreground text-sm"
      )}
    >
      {isLowTime ? (
        <AlertTriangle className="size-4 text-destructive animate-bounce" />
      ) : (
        <Clock className="size-4 text-primary" />
      )}
      <span>{formatted}</span>
    </div>
  );
}
