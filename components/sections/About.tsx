"use client";

import { Play } from "lucide-react";
import {
  FadeIn,
  TextReveal,
  ParallaxLayer,
  CountUp,
  StaggerChildren,
  StaggerItem,
} from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";

export default function About() {
  return (
    <section id="about-section" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="001" label="who we are" />
          </FadeIn>

          <TextReveal
            as="p"
            delay={0.1}
            className="mt-8 max-w-3xl text-3xl font-medium leading-snug tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            <span className="text-foreground">
              We helps startups, SMEs & enterprises design and deploy intelligent
              automation systems that{" "}
            </span>
            <span className="text-muted">
              streamline operations and unlock scalable growth.
            </span>
          </TextReveal>
        </div>

        {/* Video + Stats */}
        <div className="mt-16">
          <ParallaxLayer speed={0.1}>
            <FadeIn delay={0.2}>
              <div className="relative overflow-hidden rounded-3xl bg-gray-100">
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <button
                    type="button"
                    aria-label="Play video"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-xl active:scale-[0.97]"
                  >
                    <Play className="h-6 w-6 text-foreground" />
                  </button>
                </div>
              </div>
            </FadeIn>
          </ParallaxLayer>

          {/* Stats ticker with CountUp */}
          <FadeIn delay={0.3}>
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <StaggerChildren
                className="flex animate-ticker whitespace-nowrap py-6"
                stagger={0.1}
              >
                {[
                  { value: 500, suffix: "+", label: "saved hours" },
                  { value: 80, suffix: "%", label: "productivity boost" },
                  { value: 5, suffix: "x", label: "faster response" },
                  { value: 500, suffix: "+", label: "saved hours" },
                  { value: 80, suffix: "%", label: "productivity boost" },
                  { value: 5, suffix: "x", label: "faster response" },
                ].map((stat, i) => (
                  <StaggerItem key={i}>
                    <div className="mx-8 flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        <CountUp
                          target={stat.value}
                          suffix={stat.suffix}
                          duration={2}
                        />
                      </span>
                      <span className="text-sm text-muted">{stat.label}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
