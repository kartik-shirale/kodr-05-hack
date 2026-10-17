import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <ShieldAlert className="size-5" />
            </div>
            <span className="text-foreground">KODR Proctor</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
