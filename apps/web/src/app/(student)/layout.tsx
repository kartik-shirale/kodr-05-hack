import React, { Suspense } from "react";
import { StudentLayoutShell } from "./student-layout-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      }
    >
      <StudentLayoutShell>{children}</StudentLayoutShell>
    </Suspense>
  );
}
