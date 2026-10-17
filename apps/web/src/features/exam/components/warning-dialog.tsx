"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WarningDialogProps {
  open: boolean;
  warningNumber: number;
  maxWarnings: number;
  onAcknowledge: () => void;
}

export function WarningDialog({
  open,
  warningNumber,
  maxWarnings,
  onAcknowledge,
}: WarningDialogProps) {
  const isFinalWarning = warningNumber >= maxWarnings;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md border-destructive/50">
        <AlertDialogHeader>
          <div className="size-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="size-6" />
          </div>
          <AlertDialogTitle className="text-center text-xl text-destructive font-bold">
            Proctoring Warning {warningNumber} of {maxWarnings}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm pt-2 space-y-2">
            <p className="font-medium text-foreground">
              A potential violation was flagged by automated proctoring (e.g. face left frame, multiple faces, mobile phone, or tab switched).
            </p>
            {isFinalWarning ? (
              <p className="text-destructive font-bold text-xs bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
                CRITICAL NOTICE: You have reached the maximum warning limit. Any further violation will immediately terminate and submit your assessment.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Please remain focused on your screen, ensure good lighting, and keep other applications and tabs closed.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center pt-2">
          <AlertDialogAction
            onClick={onAcknowledge}
            className="w-full sm:w-auto min-w-36 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
          >
            I Understand & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
