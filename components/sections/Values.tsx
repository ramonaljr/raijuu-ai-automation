"use client";

import { Sparkles, Rocket, Blocks } from "lucide-react";
import {
  FadeIn,
  TextReveal,
  StaggerChildren,
  StaggerItem,
  ScaleIn,
} from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { VALUES } from "@/lib/constants";

const iconMap = {
  sparkles: Sparkles,
  rocket: Rocket,
  blocks: Blocks,
} as const;

export default function Values() {
  return (
    <section id="values-section" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="002" label="values" />
          </FadeIn>

          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            Three promises we&apos;ll hold ourselves to.
          </TextReveal>

          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-xl text-lg text-muted">
              The operating principles we wrote into our team agreement — and how we decide what to build for you.
            </p>
          </FadeIn>
        </div>

        {/* Value cards — staggered scale-in */}
        <StaggerChildren className="mt-16 grid gap-6 md:grid-cols-3" stagger={0.2}>
          {VALUES.map((value) => {
            const Icon = iconMap[value.icon];
            return (
              <StaggerItem key={value.number}>
                <ScaleIn initialScale={0.85}>
                  <div className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-dark-surface p-8 dot-grid transition-all duration-500 hover:border-gray-600 hover:shadow-[0_0_40px_rgba(77,101,255,0.1)]">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-6 w-6 text-white/80" />
                      </div>
                      <span className="text-sm font-medium text-white/40">
                        {value.number}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {value.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/60">
                      {value.description}
                    </p>
                  </div>
                </ScaleIn>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
