import React from "react";
import {
  Clock,
  EyeOff,
  FileKey,
  Lock,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LANDING_CONTENT } from "./content";

export function PrivacyTrust() {
  const getPrivacyIcon = (name: string) => {
    switch (name) {
      case "CheckShield":
        return <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />;
      case "EyeOff":
        return <EyeOff className="size-5 text-primary" />;
      case "Lock":
        return <Lock className="size-5 text-primary" />;
      case "Clock":
        return <Clock className="size-5 text-primary" />;
      case "Server":
        return <Server className="size-5 text-primary" />;
      case "FileKey":
      default:
        return <FileKey className="size-5 text-primary" />;
    }
  };

  return (
    <section id="privacy" className="py-20 sm:py-28 border-b border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Data Minimization & Security
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            {LANDING_CONTENT.privacyTrust.heading}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            {LANDING_CONTENT.privacyTrust.subheading}
          </p>
        </div>

        {/* 6 Grid Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_CONTENT.privacyTrust.items.map((item) => (
            <Card
              key={item.title}
              className="group rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1.5 overflow-hidden"
            >
              <CardContent className="p-6 space-y-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/10 shadow-xs">
                  {getPrivacyIcon(item.iconName)}
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight transition-colors duration-200 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
