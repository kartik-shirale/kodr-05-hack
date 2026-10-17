import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LANDING_CONTENT } from "./content";

export function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 border-b border-border/50 bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 mb-3 rounded-full">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Everything you need to know about KODR Proctor
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-balance leading-relaxed">
            Honest answers to common questions about integrity, privacy, and educator control.
          </p>
        </div>

        {/* Accordion List */}
        <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:border-border/90">
          <Accordion className="space-y-2">
            {LANDING_CONTENT.faq.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-item-${idx}`}
                className="group border-b border-border/40 py-2 last:border-b-0 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:no-underline group-hover:text-primary transition-all duration-200 py-3 group-hover:translate-x-0.5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
