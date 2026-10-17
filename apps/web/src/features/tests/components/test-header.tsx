"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, ArrowLeft, Pencil, Users, FileCheck } from "lucide-react";
import type { TestDetail } from "../schemas";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

interface TestHeaderProps {
  test: TestDetail;
}

export function TestHeader({ test }: TestHeaderProps) {
  const formattedDate = test.startsAt
    ? format(new Date(test.startsAt), "PPpp")
    : "Unscheduled";

  const isPublished = test.status === "PUBLISHED";

  return (
    <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{test.title}</h1>
            {isPublished ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-xs">
                Published
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-medium text-xs">
                Draft
              </Badge>
            )}
          </div>
          {test.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{test.description}</p>
          )}
        </div>

        {!isPublished && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/tests/${test.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Pencil className="size-3.5" />
              <span>Edit Test</span>
            </Link>
          </div>
        )}
      </div>

      {/* Meta Pills */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
          <Calendar className="size-3.5 text-primary" />
          <span>Starts: <strong className="text-foreground">{formattedDate}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
          <Clock className="size-3.5 text-primary" />
          <span>Duration: <strong className="text-foreground">{test.durationMinutes} minutes</strong></span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
          <FileCheck className="size-3.5 text-primary" />
          <span>Sets: <strong className="text-foreground">{test.sets?.length || 0}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-md border border-border/40">
          <Users className="size-3.5 text-primary" />
          <span>Total Questions: <strong className="text-foreground">
            {test.sets?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0}
          </strong></span>
        </div>
      </div>
    </div>
  );
}
