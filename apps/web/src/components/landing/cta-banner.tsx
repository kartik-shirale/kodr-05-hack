import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { LANDING_CONTENT } from "./content";

interface CtaBannerProps {
  isAuthenticated?: boolean;
}

export function CtaBanner({ isAuthenticated = false }: CtaBannerProps) {
  const { headline, subhead, primaryCta, secondaryCta } = LANDING_CONTENT.ctaBanner;

  return (
    <section className="py-20 sm:py-28 bg-background relative overflow-hidden border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/20 p-8 sm:p-14 lg:p-16 text-center max-w-4xl mx-auto shadow-md overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-primary/30">
          {/* Subtle radial pattern */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-0 pointer-events-none animate-pulse duration-[5000ms]"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-6">
            <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-xs transition-transform duration-300 hover:scale-110 hover:rotate-6 cursor-pointer">
              <ShieldAlert className="size-6" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              {headline}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto text-balance leading-relaxed">
              {subhead}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group w-full sm:w-auto rounded-full px-8 font-medium shadow-sm gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
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
                    "group w-full sm:w-auto rounded-full px-8 font-medium shadow-sm gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                  )}
                >
                  <span>{primaryCta}</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              )}

              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "group w-full sm:w-auto rounded-full px-6 font-medium gap-2 text-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-105 active:scale-95"
                )}
              >
                <GraduationCap className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>{secondaryCta}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
