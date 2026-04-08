"use client";

import { Search, Layout, Settings, CheckCircle, Rocket } from "lucide-react";
import {
  FadeIn,
  TextReveal,
} from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { PROCESS_STEPS } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  layout: Layout,
  settings: Settings,
  check: CheckCircle,
  rocket: Rocket,
};

export default function Process() {
  return (
    <section id="process-section" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="004" label="process" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            How We Work
          </TextReveal>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              A proven process designed to transform complex workflows into
              scalable AI-powered systems — efficiently and strategically.
            </p>
          </FadeIn>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center gradient line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-400 via-purple-400 via-pink-400 to-yellow-400 md:block" />

          <div className="space-y-4">
            {PROCESS_STEPS.map((step, idx) => {
              const Icon = iconMap[step.icon];
              const isOdd = idx % 2 === 0; // 0,2,4 → steps 01,03,05: icon-left, text-right

              return (
                <FadeIn
                  key={step.number}
                  direction={isOdd ? "left" : "right"}
                  distance={40}
                  delay={idx * 0.1}
                  className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center"
                >
                  {/* LEFT side */}
                  <div
                    className={`flex items-center gap-4 p-6 md:py-10 ${
                      isOdd
                        ? "justify-end rounded-2xl bg-gray-100 md:pr-12"
                        : "justify-end md:pr-12"
                    }`}
                  >
                    {isOdd ? (
                      <>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dark-surface shadow-lg">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-muted">
                          {step.number}
                        </span>
                      </>
                    ) : (
                      <div className="text-right">
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {step.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CENTER dot */}
                  <div className="hidden items-center justify-center md:flex">
                    <div className="relative z-10">
                      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-pink-300 via-purple-200 to-blue-300 opacity-60 blur-sm" />
                      <div className="relative h-4 w-4 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg" />
                    </div>
                  </div>

                  {/* RIGHT side */}
                  <div
                    className={`flex items-center gap-4 p-6 md:py-10 ${
                      !isOdd
                        ? "rounded-2xl bg-gray-100 md:pl-12"
                        : "md:pl-12"
                    }`}
                  >
                    {isOdd ? (
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {step.description}
                        </p>
                      </div>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-muted">
                          {step.number}
                        </span>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dark-surface shadow-lg">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
