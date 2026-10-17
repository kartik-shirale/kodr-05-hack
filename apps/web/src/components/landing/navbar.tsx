"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Menu, ShieldAlert, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { LANDING_CONTENT } from "./content";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-all duration-300 group-hover:shadow-md group-hover:bg-primary/90">
            <ShieldAlert className="size-4 transition-transform duration-300 group-hover:rotate-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
              {LANDING_CONTENT.brand.name}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Educator & Assessment
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          {LANDING_CONTENT.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 text-xs lg:text-sm transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1.5 rounded-md hover:bg-muted/60 transition-all duration-200"
          >
            <GraduationCap className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
            <span>{LANDING_CONTENT.nav.studentLogin}</span>
          </Link>

          <span className="h-4 w-px bg-border/60" aria-hidden="true" />

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "sm" }),
                "group rounded-full gap-1.5 px-4 font-medium shadow-xs transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors duration-200 hover:bg-muted/40"
              >
                {LANDING_CONTENT.nav.teacherSignIn}
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full px-4 text-xs font-medium shadow-xs transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {LANDING_CONTENT.nav.teacherSignUp}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "xs" }), "text-xs rounded-full")}
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border/60 bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            {LANDING_CONTENT.nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <GraduationCap className="size-4" />
              <span>{LANDING_CONTENT.nav.studentLogin}</span>
            </Link>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ size: "sm" }), "w-full rounded-full justify-center")}
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full justify-center text-xs"
                  )}
                >
                  {LANDING_CONTENT.nav.teacherSignIn}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-full justify-center text-xs"
                  )}
                >
                  {LANDING_CONTENT.nav.teacherSignUp}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
