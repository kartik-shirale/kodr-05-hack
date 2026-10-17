"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";
import { useMe } from "@/features/auth/hooks/use-me";
import { Skeleton } from "@/components/ui/skeleton";

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isJoinRoute = pathname.startsWith("/join");
  const isExamRoom = pathname.startsWith("/exam/room");
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    // Only enforce student authentication on /exam routes
    if (!isJoinRoute && !isLoading) {
      if (isError || !user || user.role !== "STUDENT") {
        router.push("/login");
      }
    }
  }, [isJoinRoute, isLoading, isError, user, router]);

  if (!isJoinRoute && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Show header on join, lobby, done (room has its own dedicated proctored header) */}
      {!isExamRoom && (
        <header className="h-14 border-b border-border/50 bg-background/95 backdrop-blur px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <ShieldCheck className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              KODR Assessment
            </span>
          </div>

          {user && user.role === "STUDENT" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
              <User className="size-3.5" />
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
          )}
        </header>
      )}

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

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
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </Suspense>
  );
}
