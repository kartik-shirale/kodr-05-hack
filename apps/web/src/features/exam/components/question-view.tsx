"use client";

import React from "react";
import { Check, CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { ExamQuestionItem } from "../schemas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

interface QuestionViewProps {
  question: ExamQuestionItem;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  onSelectOption: (index: number) => void;
  saveStatus?: "saved" | "saving" | "error";
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelectOption,
  saveStatus,
}: QuestionViewProps) {
  return (
    <div className="space-y-6">
      {/* Question Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-lg text-foreground">
            Question {questionNumber}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            of {totalQuestions}
          </span>
          <Badge variant="secondary" className="text-xs ml-1">
            {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
          </Badge>
        </div>

        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {saveStatus === "saving" ? (
            <span className="text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : saveStatus === "saved" ? (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check className="size-3.5" />
              <span>Saved</span>
            </span>
          ) : saveStatus === "error" ? (
            <span className="text-destructive flex items-center gap-1">
              <span>Retrying save...</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
        {question.text}
      </div>

      {/* Options List */}
      <div className="space-y-3 pt-2">
        {question.options.map((option, optIdx) => {
          const isSelected = selectedIndex === optIdx;
          const optionChar = String.fromCharCode(65 + optIdx);

          return (
            <div
              key={optIdx}
              onClick={() => onSelectOption(optIdx)}
              className={cn(
                "group flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                  : "border-border/70 hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "size-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 text-muted-foreground group-hover:border-primary/60"
                )}
              >
                {optionChar}
              </div>

              <div className="flex-1 text-sm sm:text-base leading-relaxed text-foreground">
                {option}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
