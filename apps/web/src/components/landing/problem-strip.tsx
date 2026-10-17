import React from "react";
import { AlertOctagon, EyeOff, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LANDING_CONTENT } from "./content";

export function ProblemStrip() {
  const getIcon = (name: string) => {
    switch (name) {
      case "ShieldOff":
        return <ShieldOff className="size-5 text-destructive" />;
      case "EyeOff":
        return <EyeOff className="size-5 text-amber-600 dark:text-amber-400" />;
      case "AlertOctagon":
      default:
        return <AlertOctagon className="size-5 text-primary" />;
    }
  };

  return (
    <section className="py-14 sm:py-20 border-b border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            The Remote Assessment Challenge
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Why traditional online invigilation fails both educators and students
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LANDING_CONTENT.problemStrip.map((item) => (
            <Card
              key={item.title}
              className="group relative rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:border-border/90 hover:-translate-y-1.5 overflow-hidden"
            >
              {/* Subtle top accent bar that expands on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

              <CardContent className="p-6 space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-muted/80 shadow-xs">
                  {getIcon(item.iconName)}
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight transition-colors duration-200 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
