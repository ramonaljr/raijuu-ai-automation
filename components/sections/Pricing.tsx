"use client";

import { useState } from "react";
import { FadeIn, TextReveal, ScaleIn } from "@/components/shared/motion";
import { Check, ArrowRight, Sparkles, Phone } from "lucide-react";
import SectionBadge from "@/components/ui/SectionBadge";
import { PRICING_PLANS } from "@/lib/constants";

function PriceDisplay({ price }: { price: string }) {
  // Split "$499.00" into "$499" and ".00"
  const dotIndex = price.indexOf(".");
  const main = dotIndex >= 0 ? price.slice(0, dotIndex) : price;
  const cents = dotIndex >= 0 ? price.slice(dotIndex) : "";

  return (
    <span>
      <span className="text-4xl font-bold md:text-5xl">{main}</span>
      <span className="text-4xl font-bold text-muted/40 md:text-5xl">
        {cents}
      </span>
    </span>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = isAnnual ? PRICING_PLANS.annually : PRICING_PLANS.monthly;

  return (
    <section id="pricing-section" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="008" label="pricing" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            Built for Growth at Every Stage
          </TextReveal>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Whether you&apos;re starting small or scaling fast, we have an
              automation plan that fits.
            </p>
          </FadeIn>

          {/* Toggle */}
          <FadeIn delay={0.3} className="mt-8 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer ${
                !isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer ${
                isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              ANNUALLY (SAVE 10%)
            </button>
          </FadeIn>
        </div>

        {/* Plans — two columns inside one card */}
        <ScaleIn
          initialScale={0.95}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white"
        >
          <div className="grid md:grid-cols-2 md:divide-x md:divide-gray-200">
            {plans.map((plan) => (
              <div key={plan.name} className="relative flex flex-col p-8 md:p-10">
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    plan.popular
                      ? "bg-gradient-to-br from-pink-400 to-purple-400"
                      : "bg-dark-surface"
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>

                {/* Plan header */}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-2">
                  <PriceDisplay price={plan.price} />
                  <span className="text-sm text-muted">{plan.period}</span>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-gray-200" />

                {/* Features */}
                <div className="flex-1">
                  <p className="mb-4 text-sm font-semibold text-muted">
                    {plan.includes}
                  </p>
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Check className="h-4 w-4 text-muted" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA — full width */}
                <a
                  href="#CTA-Form"
                  className="mt-8 flex items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-medium text-background transition-all duration-500 hover:bg-gray-800 active:scale-[0.97]"
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </ScaleIn>

        {/* Consultation CTA — gradient card below */}
        <FadeIn delay={0.2} className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-pink-200 via-purple-100 to-yellow-100 p-10 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-600 to-gray-900 ring-4 ring-white/50" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
                <Phone className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <h4 className="text-lg font-bold">
              Not sure which plan is right for you?
            </h4>
            <p className="mt-2 text-sm text-foreground/60">
              Book a free 30-minute AI strategy session.
            </p>
            <a
              href="#CTA-Form"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition-all duration-500 hover:bg-gray-800 active:scale-[0.97]"
            >
              Book a Free Consultation
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
