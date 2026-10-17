"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TestForm } from "@/features/tests/components/test-form";

export default function NewTestPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create Test</h1>
        </div>
      </div>

      <TestForm />
    </div>
  );
}
