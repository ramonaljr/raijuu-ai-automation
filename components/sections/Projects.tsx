"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn, TextReveal } from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { CASE_STUDIES } from "@/lib/constants";

export default function Projects() {
  const [current, setCurrent] = useState(0);

  const prev = () =>
    setCurrent((c) => (c === 0 ? CASE_STUDIES.length - 1 : c - 1));
  const next = () =>
    setCurrent((c) => (c === CASE_STUDIES.length - 1 ? 0 : c + 1));

  const study = CASE_STUDIES[current];

  return (
    <section id="project-section" className="relative bg-white py-24 lg:py-32">
      {/* Large edge-positioned nav arrows */}
      <button
        onClick={prev}
        aria-label="Previous case study"
        className="absolute left-4 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-dark-surface text-white shadow-xl transition-all duration-500 hover:scale-110 active:scale-[0.97] cursor-pointer lg:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        aria-label="Next case study"
        className="absolute right-4 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-dark-surface text-white shadow-xl transition-all duration-500 hover:scale-110 active:scale-[0.97] cursor-pointer lg:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="mx-auto max-w-6xl px-4">
        {/* Header — inside a centered card like reference */}
        <div className="mb-12 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="005" label="Case studies" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            What We&apos;ve Built
          </TextReveal>
        </div>

        {/* Mobile arrows */}
        <div className="mb-4 flex justify-end gap-2 lg:hidden">
          <button
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-surface text-white transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-surface text-white transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Case study card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50"
          >
            <div className="grid md:grid-cols-2">
              {/* Image — dark rounded-square with 3D blob */}
              <div className="flex aspect-square items-center justify-center p-8 md:aspect-auto md:p-12">
                <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-gray-800 to-gray-950 shadow-2xl">
                  {/* 3D glossy droplet shape */}
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-b from-gray-600 via-gray-900 to-black shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
                    <div className="absolute -bottom-3 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-gray-700 to-transparent blur-sm" />
                    {/* Highlight */}
                    <div className="absolute left-6 top-4 h-3 w-3 rounded-full bg-white/30 blur-[2px]" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between p-8 md:p-10">
                <div>
                  {/* Company logo placeholder */}
                  <div className="mb-4 text-lg font-bold tracking-wider text-muted">
                    LGPSM
                  </div>

                  <h3 className="text-2xl font-bold">{study.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {study.description}
                  </p>
                  <a
                    href="#CTA-Form"
                    className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-all duration-500"
                  >
                    Read More
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 transition-all duration-500 group-hover:bg-foreground group-hover:text-background">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </a>
                </div>

                {/* Metrics */}
                <div className="mt-8 flex gap-8 border-t border-gray-200 pt-6">
                  {study.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-xs text-muted">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
