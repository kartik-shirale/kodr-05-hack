"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";
import { useMe } from "@/features/auth/hooks/use-me";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentLayoutShell({ children }: { children: React.ReactNode }) {
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

          {isLoading ? (
            <Skeleton className="h-7 w-28 rounded-full" />
          ) : user && user.role === "STUDENT" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
              <User className="size-3.5" />
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
          ) : null}
        </header>
      )}

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
