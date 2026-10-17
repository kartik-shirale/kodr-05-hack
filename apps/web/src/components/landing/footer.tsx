import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldAlert } from "lucide-react";
import { LANDING_CONTENT } from "./content";

export function Footer() {
  const { footer, brand } = LANDING_CONTENT;

  return (
    <footer className="border-t border-border/60 bg-background py-12 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border/40">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <ShieldAlert className="size-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {brand.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {brand.tagline}
              </span>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="flex flex-wrap items-center justify-center gap-6 font-medium">
            {footer.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Portals */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <GraduationCap className="size-3.5" />
              <span>{footer.studentLink}</span>
            </Link>
            <span className="text-border" aria-hidden="true">•</span>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              {footer.teacherLogin}
            </Link>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>{footer.copyright}</p>
          <p className="text-muted-foreground/80 text-center sm:text-right">
            Designed for institutional rigor, privacy preservation, and teacher authority.
          </p>
        </div>
      </div>
    </footer>
  );
}
