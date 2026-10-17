"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "cn";

export type TestSectionId = "test-details" | "proctoring-policy" | "question-sets";

interface TestCreationTimelineProps {
  title: string;
  startsAt: string;
  warningsEnabled: boolean;
  sets: Array<{
    name: string;
    questions: Array<{
      text: string;
    }>;
  }>;
  activeSection: TestSectionId;
  onSectionClick: (sectionId: TestSectionId) => void;
}

export function TestCreationTimeline({
  title,
  startsAt,
  sets,
  activeSection,
  onSectionClick,
}: TestCreationTimelineProps) {
  const isDetailsComplete = Boolean(title && title.trim().length > 0 && startsAt);
  const hasValidQuestions =
    sets.length > 0 &&
    sets.every(
      (s) =>
        s.questions &&
        s.questions.length > 0 &&
        s.questions.some((q) => q.text && q.text.trim().length > 0)
    );

  const steps: Array<{
    id: TestSectionId;
    stepIndex: number;
    title: string;
    isComplete: boolean;
  }> = [
    {
      id: "test-details",
      stepIndex: 1,
      title: "Details",
      isComplete: isDetailsComplete,
    },
    {
      id: "proctoring-policy",
      stepIndex: 2,
      title: "Proctoring",
      isComplete: true,
    },
    {
      id: "question-sets",
      stepIndex: 3,
      title: "Questions",
      isComplete: hasValidQuestions,
    },
  ];

  return (
    <div className="w-full">
      <nav aria-label="Progress" className="flex items-center justify-center">
        <ol className="flex items-center gap-2 sm:gap-4 w-full max-w-xl">
          {steps.map((step, index) => {
            const isActive = activeSection === step.id;

            return (
              <li key={step.id} className="flex-1 flex items-center">
                <button
                  type="button"
                  onClick={() => onSectionClick(step.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left border cursor-pointer",
                    isActive
                      ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                      : step.isComplete
                        ? "border-border/80 bg-muted/40 text-foreground hover:bg-muted"
                        : "border-border/40 text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                      isActive
                        ? "bg-background text-foreground"
                        : step.isComplete
                          ? "bg-foreground/10 text-foreground"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.isComplete && !isActive ? (
                      <Check className="size-3 stroke-[2.5]" />
                    ) : (
                      step.stepIndex
                    )}
                  </span>
                  <span className="truncate">{step.title}</span>
                </button>

                {index < steps.length - 1 && (
                  <div className="w-2 sm:w-4 h-px bg-border/60 mx-1 shrink-0" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
