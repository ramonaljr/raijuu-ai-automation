"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { FadeIn, TextReveal, StaggerChildren, StaggerItem } from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { FAQS } from "@/lib/constants";

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section id="FAQ-section" className="bg-gray-50 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="010" label="FAQs" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            Common Questions
          </TextReveal>
        </div>

        {/* Accordion — full width, centered */}
        <StaggerChildren className="space-y-3" stagger={0.1}>
          {FAQS.map((faq, idx) => (
            <StaggerItem key={idx}>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-md">
              <button
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between p-5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-muted">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{faq.question}</span>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    openIndex === idx
                      ? "bg-foreground text-background"
                      : "bg-dark-surface text-white"
                  }`}
                >
                  {openIndex === idx ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pl-17">
                      <p className="text-sm leading-relaxed text-muted">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Contact CTA — centered below accordion */}
        <FadeIn delay={0.3} className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">Have any other questions?</p>
          <a
            href="#CTA-Form"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-all duration-500 hover:text-gray-600"
          >
            Contact Us
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
