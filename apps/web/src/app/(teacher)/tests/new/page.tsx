"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TestForm } from "@/features/tests/components/test-form";

export default function NewTestPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Test</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define questions, multiple sets for randomization, and AI proctoring warning limits.
          </p>
        </div>
      </div>

      <TestForm />
    </div>
  );
}
