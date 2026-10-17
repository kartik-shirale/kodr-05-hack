"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";
import { LANDING_CONTENT } from "./content";

interface HeroProps {
  isAuthenticated?: boolean;
}

export function Hero({ isAuthenticated = false }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-radial from-muted/40 via-background to-background border-b border-border/50">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto mb-14 md:mb-18 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Top Pill Chip */}
          <div className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-background/80 text-xs font-medium text-foreground shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-muted-foreground">{LANDING_CONTENT.hero.highlightBadge}</span>
            <span className="text-border" aria-hidden="true">•</span>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
              Teacher makes the final call
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance transition-all duration-300">
            {LANDING_CONTENT.hero.headline}
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            {LANDING_CONTENT.hero.subhead}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group w-full sm:w-auto rounded-full px-7 font-medium shadow-sm gap-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group w-full sm:w-auto rounded-full px-7 font-medium shadow-sm gap-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <span>{LANDING_CONTENT.hero.primaryCta}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            )}

            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto rounded-full px-6 font-medium gap-2 text-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <span>{LANDING_CONTENT.hero.secondaryCta}</span>
            </a>
          </div>

          {/* Micro trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              No continuous video recording
            </span>
            <span className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              No student accounts needed
            </span>
            <span className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Human-in-the-loop review
            </span>
          </div>
        </div>

        {/* Hero Composite Mockup (Live React Components) */}
        <div className="relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          {/* Ambient Glow */}
          <div
            className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 rounded-2xl blur-2xl opacity-75 animate-pulse duration-[6000ms] -z-10"
            aria-hidden="true"
          />

          {/* Primary Dashboard Card Mock */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-border/90 hover:-translate-y-0.5">
            {/* Mock Window Bar */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-destructive/60 transition-transform duration-200 hover:scale-125" />
                <div className="size-3 rounded-full bg-amber-500/60 transition-transform duration-200 hover:scale-125" />
                <div className="size-3 rounded-full bg-emerald-500/60 transition-transform duration-200 hover:scale-125" />
                <span className="ml-2 text-xs font-medium text-muted-foreground hidden sm:inline">
                  KODR Proctor — Educator Overview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border border-border/60 text-[11px] font-medium text-foreground shadow-xs">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Proctoring</span>
                </div>
              </div>
            </div>

            {/* Dashboard Table Preview */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/40">
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    Active Examinations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time monitoring with automated vision proctoring and risk classification.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border border-border/40 font-mono">
                    20s auto-refresh
                  </div>
                </div>
              </div>

              {/* Table with real sample row as requested */}
              <div className="rounded-lg border border-border/60 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 text-xs">
                    <TableRow>
                      <TableHead>Test Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead className="text-right">Risk Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow className="bg-background transition-colors duration-200 hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground py-3.5">
                        <div className="flex flex-col">
                          <span>KODR Test</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            2 Sets • Starts Today, 9:00 AM
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-[11px] transition-transform duration-200 hover:scale-105">
                          Published
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">60 mins</TableCell>
                      <TableCell className="text-foreground font-medium">
                        1 submitted / 2 total
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground text-[10px] gap-1 transition-transform duration-200 hover:scale-105 shadow-xs">
                            <AlertTriangle className="size-3" />
                            <span>1 HIGH RISK</span>
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Layered Cards Composite: Session Snapshot + Event Review */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                {/* Left Mini-Card: Flagged Violation Event */}
                <div className="group md:col-span-7 rounded-lg border border-border/70 bg-muted/20 p-4 space-y-3 relative transition-all duration-300 hover:border-destructive/30 hover:bg-muted/30 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-destructive/15 text-destructive flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        <Smartphone className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        PHONE_DETECTED
                      </span>
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 animate-pulse">
                        Warning 1 of 2
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      09:14:22 (+5 pts)
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI vision identified a handheld mobile device in student frame for 2.4 seconds.
                  </p>

                  {/* Thumbnail and teacher review action simulation */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {/* Snapshot mockup thumbnail */}
                    <div className="w-28 h-16 rounded-md bg-neutral-900 border border-border/80 flex flex-col items-center justify-center text-neutral-400 p-1 relative overflow-hidden group/thumb cursor-pointer shadow-xs">
                      <div className="transition-transform duration-300 group-hover/thumb:scale-110 flex flex-col items-center">
                        <Camera className="size-4 mb-0.5 text-neutral-300" />
                        <span className="text-[9px] font-mono">Snapshot #104</span>
                        <span className="text-[8px] text-emerald-400 font-mono">Conf: 94%</span>
                      </div>
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200" />
                    </div>

                    {/* Teacher review buttons */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">
                        Teacher Review:
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-destructive/15 text-destructive font-semibold px-2 py-0.5 rounded border border-destructive/30 transition-all duration-200 hover:scale-105 shadow-xs">
                          <Check className="size-3" /> Valid
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/60 transition-all duration-200 hover:bg-muted/80">
                          False Alarm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Mini-Card: Floating Risk Score Meter */}
                <div className="md:col-span-5 rounded-lg border border-border/70 bg-background p-4 flex flex-col justify-between space-y-3 transition-all duration-300 hover:shadow-sm hover:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Session Integrity Level
                    </span>
                    <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground text-[10px] shadow-xs">
                      HIGH RISK (28)
                    </Badge>
                  </div>

                  {/* Visual risk meter bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Low (0-9)</span>
                      <span>Med (10-24)</span>
                      <span className="font-bold text-destructive">High (25+)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 w-[35%] transition-all duration-500" />
                      <div className="bg-amber-500 w-[30%] transition-all duration-500" />
                      <div className="bg-destructive w-[35%] transition-all duration-500" />
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                    <span>Participant: <strong>Maya Patel</strong></span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      Set A
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
