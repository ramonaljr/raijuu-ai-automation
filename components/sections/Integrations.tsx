"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { FadeIn, TextReveal } from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { INTEGRATION_ROWS } from "@/lib/constants";

export default function Integrations() {
  return (
    <section id="integrations-section" className="bg-white py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="006" label="integrations" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            Technology Ecosystem
          </TextReveal>
        </div>
      </div>

      {/* Scrolling integration rows — full bleed with center orb */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Center floating orb with rainbow glow */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          {/* Rainbow glow halo */}
          <div className="absolute h-48 w-48 rounded-full bg-gradient-to-br from-pink-200 via-purple-100 to-yellow-100 blur-xl" />
          <a
            href="#CTA-Form"
            className="pointer-events-auto relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-950 shadow-2xl transition-transform hover:scale-105"
          >
            <Zap className="h-7 w-7 text-white/70" />
            <span className="mt-1 text-[10px] font-medium text-white/60">
              Try with Raijuu
            </span>
          </a>
        </div>

        <div className="space-y-3 py-4">
          {INTEGRATION_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="overflow-hidden">
              <div
                className={`flex whitespace-nowrap ${
                  rowIdx % 2 === 0
                    ? "animate-scroll-left"
                    : "animate-scroll-right"
                }`}
              >
                {[...row, ...row].map((name, i) => (
                  <div
                    key={`${rowIdx}-${i}`}
                    className="mx-1.5 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-foreground"
                  >
                    {/* Logo icon placeholder */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <div className="h-4 w-4 rounded bg-gray-300" />
                    </div>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mx-auto max-w-6xl px-4">
        <p className="mt-10 text-center text-sm text-muted">
          Our automation architecture connects data, workflows, and platforms
          into a secure, high-performance system that grows with you.
        </p>
      </div>
    </section>
  );
}
