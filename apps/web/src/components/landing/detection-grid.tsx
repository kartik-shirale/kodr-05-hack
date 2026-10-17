import React from "react";
import { Eye, Monitor, ShieldCheck, Smartphone, Users, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LANDING_CONTENT } from "./content";

export function DetectionGrid() {
  const getDetectionIcon = (name: string) => {
    switch (name) {
      case "UserX":
        return <UserX className="size-5 text-primary" />;
      case "Users":
        return <Users className="size-5 text-primary" />;
      case "Eye":
        return <Eye className="size-5 text-primary" />;
      case "Smartphone":
        return <Smartphone className="size-5 text-primary" />;
      case "Monitor":
      default:
        return <Monitor className="size-5 text-primary" />;
    }
  };

  return (
    <section id="detections" className="py-20 sm:py-28 border-y border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Computer Vision Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            {LANDING_CONTENT.detections.heading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            {LANDING_CONTENT.detections.subheading}
          </p>
        </div>

        {/* 5 Detection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          {LANDING_CONTENT.detections.items.map((item) => (
            <Card
              key={item.id}
              className="group relative rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-2 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

              <CardContent className="p-5 space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 shadow-xs">
                  {getDetectionIcon(item.iconName)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground tracking-tight transition-colors duration-200 group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                  {item.triggerCriteria}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Explanatory note on sustained-duration and cooldown filters */}
        <div className="max-w-3xl mx-auto rounded-xl border border-border/70 bg-background p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-semibold text-foreground">
              {LANDING_CONTENT.detections.filtersNote.title}
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              {LANDING_CONTENT.detections.filtersNote.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
