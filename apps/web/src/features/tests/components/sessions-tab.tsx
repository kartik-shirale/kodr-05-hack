"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { useSessions } from "@/features/sessions/hooks/use-sessions";
import type { SessionTableRow, SessionListQueryParams } from "@/features/sessions/schemas";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NativeSelect,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionsTabProps {
  testId: string;
}

export function SessionsTab({ testId }: SessionsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const riskFilter = (searchParams.get("risk") as any) || undefined;
  const statusFilter = (searchParams.get("status") as any) || undefined;
  const sortFilter = (searchParams.get("sort") as any) || "risk:desc";
  const page = Number(searchParams.get("page")) || 1;

  const { data: response, isLoading } = useSessions(
    testId,
    {
      risk: riskFilter,
      status: statusFilter,
      sort: sortFilter,
      page,
      limit: 15,
    },
    {
      refetchInterval: 20000, // 20s polling as specified in doc
    }
  );

  const sessions = response?.data || [];
  const meta = response?.meta;

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/tests/${testId}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar with Live Indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Polling Indicator */}
          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border/60 text-xs font-semibold shadow-xs">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground">Live Monitoring</span>
            <span className="text-muted-foreground text-[10px] font-normal">(20s auto-refresh)</span>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Risk:</span>
            <NativeSelect
              value={riskFilter || "ALL"}
              onChange={(e) => updateFilters("risk", e.target.value)}
              className="h-8 text-xs w-32"
            >
              <option value="ALL">All Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </NativeSelect>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <NativeSelect
              value={statusFilter || "ALL"}
              onChange={(e) => updateFilters("status", e.target.value)}
              className="h-8 text-xs w-36"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="AUTO_SUBMITTED">Auto Submitted</option>
            </NativeSelect>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Sort:</span>
            <NativeSelect
              value={sortFilter}
              onChange={(e) => updateFilters("sort", e.target.value)}
              className="h-8 text-xs w-36"
            >
              <option value="risk:desc">Risk (Highest)</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="score:desc">Score (Highest)</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="border border-dashed border-border/80 rounded-lg p-12 text-center bg-muted/5 space-y-3">
          <Activity className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No examination sessions found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When students begin taking the exam, their live sessions, proctoring events, and risk scores will appear here.
          </p>
        </div>
      ) : (
        <div className="border border-border/60 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Student</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Score</TableHead>
                <TableHead className="font-semibold text-foreground">Warnings</TableHead>
                <TableHead className="font-semibold text-foreground">Risk Level</TableHead>
                <TableHead className="font-semibold text-foreground">Events (Total / Valid / False)</TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-foreground">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const hasSession = Boolean(session.examSessionId);
                const isHighRisk = session.riskLevel === "HIGH";
                const isMediumRisk = session.riskLevel === "MEDIUM";

                return (
                  <TableRow
                    key={session.participantId}
                    className={cn(
                      "hover:bg-muted/20",
                      isHighRisk && "bg-destructive/5 hover:bg-destructive/10"
                    )}
                  >
                    <TableCell className="py-3 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{session.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{session.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {session.status === "IN_PROGRESS" ? (
                        <Badge variant="outline" className="text-primary border-primary/30 gap-1 bg-primary/5">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          <span>In Progress</span>
                        </Badge>
                      ) : session.status === "SUBMITTED" ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                          Submitted
                        </Badge>
                      ) : session.status === "AUTO_SUBMITTED" ? (
                        <Badge variant="destructive">
                          Auto-Submitted ({session.endReason === "WARNING_LIMIT" ? "Violations" : "Time up"})
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Not Started
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-semibold text-sm">
                      {session.score !== undefined && session.score !== null ? `${session.score} pts` : "-"}
                    </TableCell>

                    <TableCell>
                      <span className={cn(
                        "font-medium text-xs px-2 py-0.5 rounded",
                        (session.warningCount || 0) > 0 ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold" : "text-muted-foreground"
                      )}>
                        {session.warningCount || 0}
                      </span>
                    </TableCell>

                    <TableCell>
                      {session.riskLevel === "HIGH" ? (
                        <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground gap-1">
                          <AlertTriangle className="size-3" />
                          <span>HIGH ({session.riskScore ?? 0})</span>
                        </Badge>
                      ) : session.riskLevel === "MEDIUM" ? (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-semibold gap-1">
                          <span>MEDIUM ({session.riskScore ?? 0})</span>
                        </Badge>
                      ) : session.riskLevel === "LOW" ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                          <ShieldCheck className="size-3" />
                          <span>LOW ({session.riskScore ?? 0})</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span title="Total events" className="font-bold">{session.events?.total ?? 0}</span>
                        <span className="text-muted-foreground">/</span>
                        <span title="Valid violations" className="text-destructive font-medium">{session.events?.valid ?? 0}</span>
                        <span className="text-muted-foreground">/</span>
                        <span title="False alarms" className="text-emerald-600 font-medium">{session.events?.falseAlarm ?? 0}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {hasSession ? (
                        <Link
                          href={`/tests/${testId}/sessions/${session.examSessionId}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs text-primary font-medium")}
                        >
                          <span>Review</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">No session</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-between border-t border-border/40 px-6 py-3.5 bg-muted/5">
              <span className="text-xs text-muted-foreground">
                Showing {((meta.page - 1) * meta.limit) + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} sessions
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateFilters("page", String(page - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium px-2">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * meta.limit >= meta.total}
                  onClick={() => updateFilters("page", String(page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
