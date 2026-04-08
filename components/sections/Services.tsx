"use client";

import {
  FadeIn,
  TextReveal,
  StaggerChildren,
  StaggerItem,
} from "@/components/shared/motion";
import {
  Check,
  ArrowRight,
  Zap,
  Shield,
  Lock,
  Key,
  Database,
  MessageSquare,
  Users,
  Send,
  CheckCircle,
  Clock,
  Mail,
  Smile,
} from "lucide-react";
import SectionBadge from "@/components/ui/SectionBadge";
import { SECURITY_FEATURES } from "@/lib/constants";

const securityIcons = [Shield, Lock, Key, Database];

export default function Services() {
  return (
    <section id="service-section" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <SectionBadge number="003" label="Capabilities" />
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            Our AI-Driven Services
          </TextReveal>
        </div>

        {/* Bento grid — 3 columns */}
        <StaggerChildren
          className="grid gap-4 md:grid-cols-3"
          stagger={0.1}
        >
          {/* Card 1: AI Workflow Automation — spans 2 rows */}
          <StaggerItem className="md:row-span-2">
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500 hover:shadow-lg">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">AI Workflow Automation.</span>{" "}
                Automate repetitive tasks across departments using intelligent
                triggers and decision logic.
              </p>

              <div className="mt-4 space-y-2">
                {["Workflow mapping", "Real-time system integration.", "Validated output"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted">
                    <Check className="h-4 w-4 text-muted" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Workflow diagram visual */}
              <div className="mt-auto flex flex-1 flex-col items-center justify-center pt-8">
                {/* Center icon with rings */}
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full border-2 border-purple-200/50" />
                  <div className="absolute -inset-2 rounded-full border-2 border-yellow-200/50" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Zap className="h-5 w-5 text-muted" />
                  </div>
                </div>

                {/* Connecting lines */}
                <div className="h-8 w-px bg-gray-200" />

                {/* Icon nodes row 1 */}
                <div className="flex gap-4">
                  {[MessageSquare, Users, Zap].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-surface shadow-md"
                    >
                      <Icon className="h-5 w-5 text-white/70" />
                    </div>
                  ))}
                </div>

                {/* Connecting lines */}
                <div className="my-3 flex gap-12">
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="h-6 w-px bg-gray-200" />
                </div>

                {/* Icon nodes row 2 */}
                <div className="flex gap-4">
                  {[Send, CheckCircle, Clock].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200/80"
                    >
                      <Icon className="h-5 w-5 text-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 2: AI Chatbots */}
          <StaggerItem>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all duration-500 hover:shadow-lg">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">
                  AI Chatbots & Conversational Agents.
                </span>{" "}
                24/7 customer support, lead qualification, booking systems, and
                AI sales reps.
              </p>
              <div className="mt-auto space-y-2 pt-6">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-accent" />
                  </div>
                  <div className="text-xs text-muted">...</div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-lg bg-dark-surface/10 px-3 py-1.5 text-xs text-foreground">
                    Can you tell me more about pricing?
                  </div>
                  <div className="ml-2 h-7 w-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-accent" />
                  </div>
                  <div className="text-xs text-muted">
                    Good day John, how I can help?
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 3: AI Data & Reporting */}
          <StaggerItem>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all duration-500 hover:shadow-lg">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">
                  AI Data & Reporting Systems.
                </span>{" "}
                Automated dashboards, business intelligence, performance
                forecasting.
              </p>
              <div className="mt-auto rounded-xl bg-white p-3 pt-6">
                <div className="flex items-end gap-1">
                  {[35, 55, 40, 70, 50, 80, 65, 75, 60, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gray-300/80"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
                  <span>Total Sales:</span>
                  <span className="font-semibold">10K</span>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 4: CRM & Sales */}
          <StaggerItem>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all duration-500 hover:shadow-lg">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">CRM & Sales Automation.</span>{" "}
                Pipeline automation, AI lead scoring, follow-ups, predictive
                insights.
              </p>
              {/* Lead profile card visual */}
              <div className="mt-auto flex items-center justify-center pt-6">
                <div className="relative">
                  {/* Background cards */}
                  <div className="absolute -left-4 top-2 h-20 w-16 rounded-lg bg-gray-200/50" />
                  <div className="absolute -right-4 top-2 h-20 w-16 rounded-lg bg-gray-200/50" />
                  {/* Main card */}
                  <div className="relative z-10 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500" />
                      <span className="mt-2 text-xs font-semibold">Liam Foster</span>
                      <span className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-600">
                        + Excellent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 5: Marketing */}
          <StaggerItem>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all duration-500 hover:shadow-lg">
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">Marketing Automation.</span>{" "}
                Email sequences, personalization engines, AI-generated content
                systems.
              </p>
              {/* Marketing visual */}
              <div className="mt-auto flex items-center justify-center gap-3 pt-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted" />
                    <div className="h-1.5 w-16 rounded-full bg-gray-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-muted" />
                    <div className="h-1.5 w-12 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerChildren>

        {/* CTA + Security row */}
        <StaggerChildren
          className="mt-4 grid gap-4 md:grid-cols-2"
          stagger={0.2}
        >
          {/* CTA card — gradient background */}
          <StaggerItem>
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-100 p-6 transition-all duration-500 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 ring-4 ring-white/50" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60">
                  <Zap className="h-4 w-4 text-foreground" />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-foreground">
                  Not sure what to automate first?
                </h4>
                <p className="mt-2 text-sm text-foreground/70">
                  Book a free 30-minute AI strategy session. We&apos;ll analyze
                  your current workflows and identify the highest-ROI automation
                  opportunities for your business.
                </p>
              </div>
              <a
                href="#CTA-Form"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-500 hover:bg-gray-800 active:scale-[0.97]"
              >
                Schedule a Session
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </a>
            </div>
          </StaggerItem>

          {/* Security card — glassmorphic icon tiles */}
          <StaggerItem>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500 hover:shadow-lg">
              <h4 className="mb-6 text-lg font-semibold">
                Your Data. Protected. Always.
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {SECURITY_FEATURES.map((feature, idx) => {
                  const Icon = securityIcons[idx];
                  return (
                    <div
                      key={feature}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner transition-transform duration-500 hover:scale-105">
                        <Icon className="h-6 w-6 text-foreground/60" />
                      </div>
                      <span className="text-[11px] leading-tight text-muted">
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  );
}
