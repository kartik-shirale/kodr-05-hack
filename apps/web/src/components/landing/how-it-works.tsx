import React from "react";
import { CalendarPlus, Camera, CheckCircle2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LANDING_CONTENT } from "./content";

export function HowItWorks() {
  const getStepIcon = (name: string) => {
    switch (name) {
      case "CalendarPlus":
        return <CalendarPlus className="size-5" />;
      case "UserCheck":
        return <UserCheck className="size-5" />;
      case "Camera":
        return <Camera className="size-5" />;
      case "CheckCircle2":
      default:
        return <CheckCircle2 className="size-5" />;
    }
  };

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-b border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Step-by-Step Flow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            {LANDING_CONTENT.howItWorks.heading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            {LANDING_CONTENT.howItWorks.subheading}
          </p>
        </div>

        {/* 4 Steps Grid with Visual Connecting Line */}
        <div className="relative">
          {/* Desktop Connecting horizontal line */}
          <div
            className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-gradient-to-r from-border via-primary/40 to-border animate-pulse duration-[4000ms] -z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {LANDING_CONTENT.howItWorks.steps.map((step, idx) => (
              <div
                key={step.number}
                className="group relative bg-card rounded-xl border border-border/70 p-6 flex flex-col justify-between shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-2"
              >
                <div>
                  {/* Step Header with Icon and Number */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="size-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {getStepIcon(step.iconName)}
                    </div>
                    <span className="font-mono text-2xl font-bold text-muted-foreground/40 transition-colors duration-300 group-hover:text-primary/70">
                      {step.number}
                    </span>
                  </div>

                  {/* Badge */}
                  <div className="mb-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {step.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-foreground tracking-tight mb-2 transition-colors duration-200 group-hover:text-primary">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground font-mono flex items-center justify-between">
                  <span>Phase {idx + 1} of 4</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary font-bold">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
