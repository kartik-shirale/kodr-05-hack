import React, { Suspense } from "react";
import { TeacherLayoutShell } from "./teacher-layout-shell";
import { Skeleton } from "@/components/ui/skeleton";

// Opt this authenticated dashboard segment out of instant prefetch validation
export const instant = false;

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      }
    >
      <TeacherLayoutShell>{children}</TeacherLayoutShell>
    </Suspense>
  );
}
