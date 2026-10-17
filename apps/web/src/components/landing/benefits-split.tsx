import React from "react";
import { CheckCircle2, GraduationCap, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANDING_CONTENT } from "./content";

export function BenefitsSplit() {
  const { teachers, students, heading, subheading } = LANDING_CONTENT.benefits;

  return (
    <section className="py-20 sm:py-28 border-b border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Stakeholder Value
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            {heading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Teachers Card */}
          <Card className="group rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-2 overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <ShieldAlert className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {teachers.badge}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight pt-2 transition-colors duration-200 group-hover:text-primary">
                {teachers.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ul className="space-y-3">
                {teachers.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-foreground transition-transform duration-200 hover:translate-x-1">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Students Card */}
          <Card className="group rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-2 overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <GraduationCap className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {students.badge}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight pt-2 transition-colors duration-200 group-hover:text-primary">
                {students.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ul className="space-y-3">
                {students.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-foreground transition-transform duration-200 hover:translate-x-1">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
