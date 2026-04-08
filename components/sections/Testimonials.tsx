"use client";

import { Play } from "lucide-react";
import { FadeIn, TextReveal, ScaleIn } from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";
import { TESTIMONIALS } from "@/lib/constants";

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* Quote mark + avatar */}
      <div className="mb-4 flex items-start justify-between">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
        <span className="text-4xl leading-none text-gray-200">&ldquo;</span>
      </div>

      {/* Name & role */}
      <h4 className="font-semibold">{testimonial.name}</h4>
      <p className="text-sm text-muted">{testimonial.role}</p>

      {/* Quote */}
      <p className="mt-4 text-sm leading-relaxed text-foreground/80">
        {testimonial.quote}
      </p>
    </div>
  );
}

function VideoCard({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-dark-surface">
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-900">
        <div className="flex h-full flex-col justify-between p-6">
          <button
            type="button"
            aria-label="Play video"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110"
          >
            <Play className="h-5 w-5 text-white" />
          </button>
          <div>
            <div className="mb-2 text-xs font-medium text-white/50">
              Logoipsum
            </div>
            <p className="text-lg font-semibold leading-snug text-white">
              {title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials-section" className="bg-gray-50 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="007" label="testimonial" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            What They&apos;re Saying
          </TextReveal>
        </div>

        {/* Masonry 3-column grid */}
        <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
          {/* Column 1 pattern: video, testimonial, testimonial */}
          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <VideoCard title="How Puno Automated 80% of Lead Handling" />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[0]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[3]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[1]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[5]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[4]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <VideoCard title="Scaling SaaS Operations with AI Automation" />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[2]} />
          </ScaleIn>

          <ScaleIn initialScale={0.9} className="break-inside-avoid">
            <TestimonialCard testimonial={TESTIMONIALS[6]} />
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
