"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Lock,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

export function FeatureShowcase() {
  const content = LANDING_CONTENT.featureShowcase;

  // Interactive state for Forensic Review Mock
  const [reviewStatus, setReviewStatus] = useState<"VALID" | "FALSE_ALARM" | "PENDING">("VALID");
  const [activeRiskScore, setActiveRiskScore] = useState<number>(28);
  const [activeRiskLevel, setActiveRiskLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");

  const handleReviewClick = (status: "VALID" | "FALSE_ALARM" | "PENDING") => {
    setReviewStatus(status);
    if (status === "FALSE_ALARM") {
      setActiveRiskScore(8);
      setActiveRiskLevel("LOW");
    } else if (status === "VALID") {
      setActiveRiskScore(28);
      setActiveRiskLevel("HIGH");
    } else {
      setActiveRiskScore(16);
      setActiveRiskLevel("MEDIUM");
    }
  };

  // State for live monitoring tab filter in mock
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("ALL");

  return (
    <div id="features" className="py-20 sm:py-28 space-y-24 sm:space-y-36 bg-background">
      {/* ─────────────────────────────────────────────────────────────
          1. TEST BUILDER & ANTI-COLLUSION SETS
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-5">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full">
              {content.testBuilder.tag}
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {content.testBuilder.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content.testBuilder.description}
            </p>
            <ul className="space-y-2.5 pt-2">
              {content.testBuilder.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Component Mock */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {/* Card 1: Proctoring Warning Policy */}
              <Card className="rounded-xl border border-border/70 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4 text-primary" />
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Proctoring Warning Policy
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Rules Config
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Define student notification behavior and disciplinary thresholds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Enable Warnings Switch */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <div className="space-y-0.5">
                      <span className="font-medium text-foreground block">Enable Student Warnings</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Displays an active warning dialog to the student when an anomaly is confirmed.
                      </span>
                    </div>
                    <Switch checked={true} disabled aria-label="Enable Warnings" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Max Allowed Warnings */}
                    <div className="space-y-1.5">
                      <label className="font-medium text-foreground block">
                        Maximum Allowed Warnings
                      </label>
                      <Input
                        type="number"
                        value={2}
                        readOnly
                        className="h-8 text-xs font-mono bg-muted/20"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Student receives up to 2 warnings before penalty.
                      </span>
                    </div>

                    {/* Auto-Submit Checkbox */}
                    <div className="space-y-1.5 flex flex-col justify-end pb-1">
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox id="mock-auto-submit" checked={true} disabled />
                        <label
                          htmlFor="mock-auto-submit"
                          className="font-medium text-foreground text-xs cursor-default"
                        >
                          Auto-Submit on Warning Limit
                        </label>
                      </div>
                      <span className="text-[10px] text-muted-foreground pl-6">
                        Automatically closes exam upon next violation.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Question Sets & MCQ Editor Mock */}
              <Card className="rounded-xl border border-border/70 bg-card shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-border/40 flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <FileCheck className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Question Sets & MCQ Editor
                    </span>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    Set A (Assigned Round-Robin)
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="font-medium text-foreground text-sm">
                    Q1. What is the capital of France?
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 rounded border border-border/60 bg-muted/20 text-muted-foreground flex items-center justify-between">
                      <span>a) Berlin</span>
                    </div>
                    <div className="p-2 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                      <span>b) Paris</span>
                      <Check className="size-3.5 text-emerald-600" />
                    </div>
                    <div className="p-2 rounded border border-border/60 bg-muted/20 text-muted-foreground flex items-center justify-between">
                      <span>c) Rome</span>
                    </div>
                    <div className="p-2 rounded border border-border/60 bg-muted/20 text-muted-foreground flex items-center justify-between">
                      <span>d) Madrid</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STUDENT MANAGEMENT & DISPATCH
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Live Component Mock (Left on desktop) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Card className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Enrolled Students (Roster)
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    4 Participants
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" className="gap-1 text-xs">
                    <UserPlus className="size-3" />
                    <span>Add Students</span>
                  </Button>
                  <Button size="xs" className="gap-1 text-xs">
                    <Send className="size-3" />
                    <span>Send Credentials</span>
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 text-xs">
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned Set</TableHead>
                      <TableHead>Credentials Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell className="font-medium text-foreground py-3">
                        Alex Chen
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        alex.chen@univ.edu
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Set A
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>Sent Oct 17, 8:30 PM</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Resend credentials">
                          <RefreshCw className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium text-foreground py-3">
                        Maya Patel
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        maya.p@univ.edu
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Set B
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>Sent Oct 17, 8:30 PM</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Resend credentials">
                          <RefreshCw className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium text-foreground py-3">
                        Jordan Lee
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        jordan.l@univ.edu
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Set A
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                          <span>Not sent yet</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Resend credentials">
                          <Send className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full">
              {content.studentManagement.tag}
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {content.studentManagement.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content.studentManagement.description}
            </p>
            <ul className="space-y-2.5 pt-2">
              {content.studentManagement.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. LIVE MONITORING & RISK TIERS
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-5">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full">
              {content.liveMonitoring.tag}
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {content.liveMonitoring.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content.liveMonitoring.description}
            </p>
            <ul className="space-y-2.5 pt-2">
              {content.liveMonitoring.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Component Mock */}
          <div className="lg:col-span-7">
            <Card className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
              {/* Filter Bar with Live Polling Indicator */}
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border/60 text-xs font-semibold">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    <span className="text-foreground">Live Monitoring</span>
                    <span className="text-muted-foreground text-[10px] font-normal">(20s auto-refresh)</span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground text-[11px] mr-1">Risk Filter:</span>
                  {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedRiskFilter(filter)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border",
                        selectedRiskFilter === filter
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions Table Mock */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 text-xs">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Warnings</TableHead>
                      <TableHead>Risk Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow className="bg-background">
                      <TableCell className="font-semibold text-foreground py-3">
                        Maya Patel
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-primary border-primary/30 gap-1 bg-primary/5 text-[10px]">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          <span>In Progress</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">-</TableCell>
                      <TableCell>
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
                          1
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground text-[10px] gap-1">
                          <AlertTriangle className="size-3" />
                          <span>HIGH (28)</span>
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow className="bg-background">
                      <TableCell className="font-semibold text-foreground py-3">
                        Alex Chen
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5 text-[10px]">
                          Submitted
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-foreground">
                        24 pts
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-[11px]">0</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] gap-1">
                          <ShieldCheck className="size-3" />
                          <span>LOW (4)</span>
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow className="bg-background">
                      <TableCell className="font-semibold text-foreground py-3">
                        David Kim
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-primary border-primary/30 gap-1 bg-primary/5 text-[10px]">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          <span>In Progress</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">-</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-[11px]">0</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-semibold text-[10px] gap-1">
                          <span>MEDIUM (14)</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FORENSIC REVIEW & HUMAN-IN-THE-LOOP (INTERACTIVE!)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Interactive Component Mock (Left on desktop) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Card className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border/90">
              <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Forensic Audit Session
                  </span>
                  <span className="text-xs text-muted-foreground">• Maya Patel</span>
                </div>

                {/* Dynamic Risk Score Badge that responds to user interaction with animated pulse */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Session Risk:</span>
                  <Badge
                    key={activeRiskScore}
                    className={cn(
                      "text-xs transition-all duration-300 shadow-xs animate-in zoom-in-95",
                      activeRiskLevel === "HIGH" && "bg-destructive text-destructive-foreground ring-2 ring-destructive/20",
                      activeRiskLevel === "MEDIUM" && "bg-amber-500 text-black font-semibold ring-2 ring-amber-500/20",
                      activeRiskLevel === "LOW" && "bg-emerald-600 text-white ring-2 ring-emerald-600/20"
                    )}
                  >
                    {activeRiskLevel} ({activeRiskScore} pts)
                  </Badge>
                </div>
              </div>

              {/* Event Card Mock with Valid / False Alarm interactive buttons */}
              <div className="p-4 sm:p-5 space-y-4">
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-all duration-300 space-y-3",
                    reviewStatus === "FALSE_ALARM"
                      ? "border-emerald-500/40 bg-emerald-500/5 opacity-85 shadow-xs"
                      : reviewStatus === "VALID"
                      ? "border-destructive/40 bg-destructive/5 shadow-xs"
                      : "border-border/60 bg-muted/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                        <Smartphone className="size-4 text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">PHONE DETECTED</span>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                        Warning 1
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        +5 pts
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <Clock className="size-3" />
                      <span>09:14:22 UTC (2.4s)</span>
                    </div>
                  </div>

                  {/* Snapshot & interactive buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-3 group/snap cursor-pointer">
                      <div className="w-24 h-16 rounded-md bg-neutral-900 border border-border/60 flex flex-col items-center justify-center text-neutral-400 shrink-0 overflow-hidden relative shadow-xs">
                        <div className="transition-transform duration-300 group-hover/snap:scale-110 flex flex-col items-center">
                          <Camera className="size-3.5 mb-0.5 text-neutral-300" />
                          <span className="text-[9px] font-mono text-neutral-300">Webcam #104</span>
                          <span className="text-[8px] text-emerald-400 font-mono">Conf: 94%</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p className="font-medium text-foreground transition-colors group-hover/snap:text-primary">
                          Handheld device visible
                        </p>
                        <p className="text-[11px]">Sustained over 2.0s duration threshold</p>
                      </div>
                    </div>

                    {/* Interactive review buttons with animated transitions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant={reviewStatus === "VALID" ? "destructive" : "outline"}
                        onClick={() => handleReviewClick("VALID")}
                        className={cn(
                          "text-xs gap-1 transition-all duration-200 active:scale-95 hover:scale-105 shadow-xs",
                          reviewStatus === "VALID" && "ring-2 ring-destructive/30"
                        )}
                      >
                        <Check className="size-3" />
                        <span>Valid</span>
                      </Button>

                      <Button
                        size="xs"
                        variant={reviewStatus === "FALSE_ALARM" ? "default" : "outline"}
                        onClick={() => handleReviewClick("FALSE_ALARM")}
                        className={cn(
                          "text-xs gap-1 transition-all duration-200 active:scale-95 hover:scale-105 shadow-xs",
                          reviewStatus === "FALSE_ALARM" && "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30"
                        )}
                      >
                        <X className="size-3" />
                        <span>False Alarm</span>
                      </Button>

                      <Button
                        size="xs"
                        variant={reviewStatus === "PENDING" ? "secondary" : "ghost"}
                        onClick={() => handleReviewClick("PENDING")}
                        className="text-xs text-muted-foreground transition-all duration-200 active:scale-95 hover:scale-105"
                      >
                        Pending
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-md border border-border/40 text-xs text-muted-foreground flex items-center justify-between transition-colors hover:bg-muted/50">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary animate-pulse" />
                    <span>Try clicking <strong>False Alarm</strong> or <strong>Valid</strong> to see the risk score update dynamically.</span>
                  </span>
                  <span className="font-mono text-[11px] text-foreground font-semibold">
                    Interactive Preview
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full">
              {content.forensicReview.tag}
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {content.forensicReview.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content.forensicReview.description}
            </p>
            <ul className="space-y-2.5 pt-2">
              {content.forensicReview.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DETECTION TUNING & CALIBRATION
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Copy Side */}
          <div className="lg:col-span-5 space-y-5">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full">
              {content.detectionTuning.tag}
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {content.detectionTuning.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content.detectionTuning.description}
            </p>
            <ul className="space-y-2.5 pt-2">
              {content.detectionTuning.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Component Mock */}
          <div className="lg:col-span-7">
            <Card className="rounded-xl border border-border/70 bg-card shadow-sm">
              <CardHeader className="p-4 border-b border-border/40 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Detection Rules & Sensitivity Tuning
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Lock className="size-3" />
                  <span>Locks at exam start</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Rule Item 1: LOOKING_AWAY */}
                <div className="rounded-lg border border-border/60 p-3.5 space-y-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="size-4 text-primary" />
                      <span className="font-semibold text-foreground">Looking Away / Head Pose</span>
                    </div>
                    {/* False alarm rate bar */}
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground">False Alarm Rate:</span>
                      <span className="font-semibold text-foreground">8.3%</span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[8.3%]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Trigger After (sec)</span>
                      <Input type="number" value={5} readOnly className="h-7 text-xs font-mono bg-muted/20" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Yaw Angle Threshold (°)</span>
                      <Input type="number" value={35} readOnly className="h-7 text-xs font-mono bg-muted/20" />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-end pb-1">
                      <div className="flex items-center gap-1.5">
                        <Checkbox checked={true} disabled />
                        <span className="text-[10px] text-muted-foreground">Ignore looking down</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule Item 2: PHONE_DETECTED */}
                <div className="rounded-lg border border-border/60 p-3.5 space-y-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="size-4 text-primary" />
                      <span className="font-semibold text-foreground">Phone in View</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground">False Alarm Rate:</span>
                      <span className="font-semibold text-foreground">1.8%</span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[1.8%]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Min Confidence</span>
                      <Input type="text" value="0.60" readOnly className="h-7 text-xs font-mono bg-muted/20" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Trigger After (sec)</span>
                      <Input type="number" value={2} readOnly className="h-7 text-xs font-mono bg-muted/20" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Risk Weight</span>
                      <Input type="number" value={5} readOnly className="h-7 text-xs font-mono bg-muted/20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
