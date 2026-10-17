import React from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LANDING_CONTENT } from "./content";

export function StudentExperience() {
  return (
    <section className="py-20 sm:py-28 border-b border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Test-Taker Perspective
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            {LANDING_CONTENT.studentExperience.heading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            {LANDING_CONTENT.studentExperience.subheading}
          </p>
        </div>

        {/* 3-Card Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Student Login & Lobby */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Phase 1: Entry & Consent
              </span>
              <h3 className="text-lg font-bold text-foreground">
                Lobby & Pre-Flight Check
              </h3>
              <p className="text-xs text-muted-foreground">
                Students review the warning policy, provide explicit consent, and test their webcam locally.
              </p>
            </div>

            {/* Reusing Student Login Card Styling as requested */}
            <Card className="group rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1.5">
              <CardHeader className="text-center pb-3 space-y-2">
                <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <GraduationCap className="size-5" />
                </div>
                <CardTitle className="text-base font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">
                  Student Exam Login
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter student email and test password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Student Email</span>
                  <Input value="alex.chen@univ.edu" readOnly className="h-8 text-xs bg-muted/20 font-mono transition-colors focus:bg-background" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Test Password</span>
                  <Input type="password" value="samplepwd123" readOnly className="h-8 text-xs bg-muted/20 font-mono transition-colors focus:bg-background" />
                </div>
                <div className="pt-1">
                  <Button className="w-full h-9 text-xs font-semibold shadow-xs" disabled>
                    Enter Exam Lobby
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <Camera className="size-3.5 text-primary animate-pulse" />
                  <span>Local camera check verified</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 2: Focused Exam Room */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Phase 2: Taking the Exam
              </span>
              <h3 className="text-lg font-bold text-foreground">
                Focus-Mode Room & Auto-Save
              </h3>
              <p className="text-xs text-muted-foreground">
                Answers are immediately saved in background. Synchronized timer features a 5-minute alert.
              </p>
            </div>

            <Card className="group rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1.5">
              <div className="p-3 border-b border-border/40 bg-muted/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="size-3.5 text-primary animate-pulse" />
                  <span className="font-mono">42:15 remaining</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-xs">
                  All answers saved
                </Badge>
              </div>

              <CardContent className="p-4 space-y-3 text-xs">
                {/* 5-minute alert simulation */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-0.5 transition-colors hover:bg-amber-500/15">
                  <span className="font-semibold block text-[11px]">Time Reminder</span>
                  <span className="text-[10px] block opacity-90">
                    A banner displays when 5 minutes remain before automatic submission.
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="font-semibold text-foreground block">
                    Question 4 of 25
                  </span>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded border border-primary bg-primary/5 text-foreground font-medium flex items-center justify-between transition-all duration-200 hover:bg-primary/10">
                      <span>Selection saved in background</span>
                      <CheckCircle2 className="size-3 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Anti-blur tracking active</span>
                  <span className="font-mono">Set A</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 3: Clear Warning Dialog Mock */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Phase 3: Immediate Guidance
              </span>
              <h3 className="text-lg font-bold text-foreground">
                Transparent In-Exam Warnings
              </h3>
              <p className="text-xs text-muted-foreground">
                No instant black-box disqualifications. Students receive actionable alerts to self-correct.
              </p>
            </div>

            <Card className="group rounded-xl border border-destructive/40 bg-card shadow-xs transition-all duration-300 hover:border-destructive hover:shadow-xl hover:-translate-y-1.5">
              <CardContent className="p-5 text-center space-y-3">
                <div className="size-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                  <AlertTriangle className="size-5 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-destructive">
                    Proctoring Warning 1 of 2
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A potential violation was flagged by automated proctoring (e.g. face left frame or tab switched).
                  </p>
                </div>

                <div className="p-2.5 rounded bg-muted/40 border border-border/40 text-[11px] text-muted-foreground transition-colors group-hover:bg-muted/60">
                  Please remain focused on your screen and ensure proper lighting.
                </div>

                <div className="pt-1">
                  <Button
                    size="sm"
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold shadow-xs"
                    disabled
                  >
                    I Understand & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
