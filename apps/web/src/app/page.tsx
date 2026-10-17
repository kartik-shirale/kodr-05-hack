import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProblemStrip } from "@/components/landing/problem-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { DetectionGrid } from "@/components/landing/detection-grid";
import { StudentExperience } from "@/components/landing/student-experience";
import { PrivacyTrust } from "@/components/landing/privacy-trust";
import { BenefitsSplit } from "@/components/landing/benefits-split";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "KODR Proctor — Fair, Scalable AI Online Exam Proctoring",
  description:
    "AI-powered vision proctoring for online examinations. Catches cheating automatically with head pose, face absence, phone detection, and tab tracking, while ensuring educators make the final call.",
  keywords: [
    "online proctoring",
    "AI proctoring",
    "exam monitoring",
    "academic integrity",
    "human in the loop",
    "online examination platform",
  ],
  openGraph: {
    title: "KODR Proctor — Fair, Scalable AI Online Exam Proctoring",
    description:
      "Automated vision proctoring where AI flags and the teacher decides. Zero student app installs, private snapshots, and human-in-the-loop reviews.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KODR Proctor — Fair, Scalable AI Online Exam Proctoring",
    description:
      "Automated vision proctoring where AI flags and the teacher decides. Zero student app installs, private snapshots, and human-in-the-loop reviews.",
  },
};

export default async function LandingPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* 1. Navbar */}
      <Navbar isAuthenticated={isAuthenticated} />

      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section with Live UI Mockup Composite */}
        <Hero isAuthenticated={isAuthenticated} />

        {/* 3. Problem Strip (3 Compact Cards) */}
        <ProblemStrip />

        {/* 4. How It Works (4 Connected Steps) */}
        <HowItWorks />

        {/* 5. Feature Showcase (5 Alternating Live Mocks) */}
        <FeatureShowcase />

        {/* 6. Detection Grid (5 Visual Checks + Filter Note) */}
        <DetectionGrid />

        {/* 7. Student Experience (3-Card Strip + Student Login Mock) */}
        <StudentExperience />

        {/* 8. Privacy & Trust Section (Data Minimization) */}
        <PrivacyTrust />

        {/* 9. Benefits Split (Teachers vs. Students) */}
        <BenefitsSplit />

        {/* 10. FAQ Section (Accordion) */}
        <FaqSection />

        {/* 11. Final High-Impact CTA Banner */}
        <CtaBanner isAuthenticated={isAuthenticated} />
      </main>

      {/* 12. Minimal Footer */}
      <Footer />
    </div>
  );
}
