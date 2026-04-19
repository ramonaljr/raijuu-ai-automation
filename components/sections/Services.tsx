"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, StaggerChildren, StaggerItem, cinematicSpring } from "@/components/shared/motion";
import { Zap, Shield, Lock, Key, Database, MessageSquare, Users, Send, CheckCircle, Clock, Mail, Smile, ArrowRight } from "lucide-react";
import { SECURITY_FEATURES } from "@/lib/constants";

const securityIcons = [Shield, Lock, Key, Database];

export default function Services() {
  return (
    <section id="service-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-20 flex flex-col items-center text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                Capabilities
              </span>
            </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl text-white"
          >
            Pick where you&apos;re stuck. <span className="text-white/40">We handle the rest.</span>
          </TextReveal>
        </div>

        {/* Bento grid — 3 columns */}
        <StaggerChildren className="grid gap-6 md:grid-cols-3" stagger={0.1}>
          {/* Card 1: AI Workflow Automation */}
          <StaggerItem className="md:row-span-2">
            <motion.div 
              whileHover={{ y: -5 }}
              transition={cinematicSpring}
              className="group relative flex h-full flex-col rounded-3xl border border-white/5 bg-[#141414] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-medium text-white mb-3">Stop copy-pasting <br/>between tools</h3>
                <p className="text-sm leading-relaxed text-[#b8b8b8]">
                  We wire your CRM, calendar, inbox, and docs together so work flows without a human in the middle.
                </p>
              </div>

              {/* Workflow diagram visual */}
              <div className="relative z-10 mt-auto flex flex-1 flex-col items-center justify-center pt-12 pb-4">
                <div className="relative mb-6">
                  <div className="absolute -inset-6 rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute -inset-3 rounded-full border border-white/20 animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a] border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="h-10 w-px bg-gradient-to-b from-white/20 to-transparent" />

                <div className="flex gap-4">
                  {[MessageSquare, Users, Zap].map((Icon, i) => (
                    <div key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <Icon className="h-5 w-5 text-white/70" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 2: AI Chatbots */}
          <StaggerItem>
            <motion.div 
              whileHover={{ y: -5 }}
              transition={cinematicSpring}
              className="group relative flex h-full flex-col rounded-3xl border border-white/5 bg-[#141414] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-white mb-2">Never lose a lead at night again</h3>
                <p className="text-sm leading-relaxed text-[#b8b8b8]">
                  A 24/7 AI chat that qualifies, books, and only wakes a human when it matters.
                </p>
              </div>
              
              <div className="relative z-10 mt-auto space-y-3 pt-8">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5 text-xs text-white backdrop-blur-md border border-white/5">
                    How much does it cost?
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(77,101,255,0.4)]">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#1a1a1a] px-4 py-2.5 text-xs text-[#cdcdcd] border border-white/5">
                    Our pricing starts at $49/mo. Would you like to see a demo?
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 3: AI Data & Reporting */}
          <StaggerItem>
            <motion.div 
              whileHover={{ y: -5 }}
              transition={cinematicSpring}
              className="group relative flex h-full flex-col rounded-3xl border border-white/5 bg-[#141414] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-white mb-2">Know the number before Monday</h3>
                <p className="text-sm leading-relaxed text-[#b8b8b8]">
                  Dashboards that refresh on their own — in plain English, not spreadsheets.
                </p>
              </div>
              
              <div className="relative z-10 mt-auto pt-8">
                 <div className="rounded-2xl bg-[#1a1a1a] p-4 border border-white/5">
                    <div className="flex items-end gap-1.5 h-24">
                      {[35, 55, 40, 70, 50, 80, 65, 75, 60, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-white/20 transition-all duration-500 group-hover:bg-white/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 4: CRM & Sales */}
          <StaggerItem>
            <motion.div 
              whileHover={{ y: -5 }}
              transition={cinematicSpring}
              className="group relative flex h-full flex-col rounded-3xl border border-white/5 bg-[#141414] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-white mb-2">Your reps sell. The system does admin.</h3>
                <p className="text-sm leading-relaxed text-[#b8b8b8]">
                  Lead scoring, follow-ups, pipeline hygiene — automatic.
                </p>
              </div>
              
              <div className="relative z-10 mt-auto flex items-center justify-center pt-8">
                <div className="relative w-full max-w-[200px]">
                  <div className="absolute -left-2 top-2 h-16 w-16 rounded-xl bg-white/5 border border-white/10" />
                  <div className="absolute -right-2 top-2 h-16 w-16 rounded-xl bg-white/5 border border-white/10" />
                  <div className="relative z-10 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col items-center">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
                      <span className="mt-3 text-sm font-medium text-white">Lead Score: 98</span>
                      <span className="mt-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                        High Intent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 5: Marketing */}
          <StaggerItem>
            <motion.div 
              whileHover={{ y: -5 }}
              transition={cinematicSpring}
              className="group relative flex h-full flex-col rounded-3xl border border-white/5 bg-[#141414] p-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-white mb-2">Personalization that isn&apos;t creepy</h3>
                <p className="text-sm leading-relaxed text-[#b8b8b8]">
                  Emails and sequences that match the buyer&apos;s moment — not spray-and-pray.
                </p>
              </div>
              
              <div className="relative z-10 mt-auto flex items-center gap-4 pt-8">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                   <Mail className="h-8 w-8 text-white/50" />
                </div>
                <div className="w-full space-y-3">
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-3/4 bg-white/40 group-hover:w-full transition-all duration-1000" />
                  </div>
                  <div className="h-2 w-4/5 rounded-full bg-white/10 overflow-hidden">
                     <div className="h-full w-1/2 bg-white/30 group-hover:w-5/6 transition-all duration-1000 delay-100" />
                  </div>
                  <div className="h-2 w-1/2 rounded-full bg-white/10 overflow-hidden">
                     <div className="h-full w-1/3 bg-accent/50 group-hover:w-full transition-all duration-1000 delay-200" />
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerChildren>

        {/* CTA + Security row */}
        <StaggerChildren className="mt-6 grid gap-6 md:grid-cols-2" stagger={0.2}>
          {/* CTA card */}
          <StaggerItem>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={cinematicSpring}
              className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-10 transition-all shadow-2xl h-full"
            >
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a0a0a] shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h4 className="mt-8 text-3xl font-medium tracking-tight text-[#0a0a0a]">
                  Not sure where you&apos;re stuck?
                </h4>
                <p className="mt-4 text-base text-[#0a0a0a]/70 font-light leading-relaxed">
                  Book a free 15-minute fit call. We&apos;ll listen to where your team is losing hours, tell you which tier fits, and show you the one automation we&apos;d build first.
                </p>
                <a
                  href="/demo"
                  className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#0a0a0a] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#1a1a1a]"
                >
                  Book my fit call
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Security card */}
          <StaggerItem>
            <div className="flex flex-col rounded-3xl border border-white/5 bg-[#141414] p-10 h-full justify-between">
              <div>
                <h4 className="text-2xl font-medium tracking-tight text-white">
                  Your data stays yours.
                </h4>
                <p className="mt-2 text-[#b8b8b8] font-light">Processed in-region where possible, encrypted end-to-end, and designed with security as a default — not an afterthought.</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {SECURITY_FEATURES.map((feature, idx) => {
                  const Icon = securityIcons[idx];
                  return (
                    <div key={feature} className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-16 w-full items-center justify-center rounded-2xl bg-[#1a1a1a] border border-white/5 transition-colors hover:bg-white/5 hover:border-white/20">
                        <Icon className="h-6 w-6 text-white/50" />
                      </div>
                      <span className="text-[12px] font-medium text-[#b8b8b8]">
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
