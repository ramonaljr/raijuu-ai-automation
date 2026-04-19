"use client";

import { Search, Layout, Settings, CheckCircle, Rocket } from "lucide-react";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { PROCESS_STEPS } from "@/lib/constants";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  layout: Layout,
  settings: Settings,
  check: CheckCircle,
  rocket: Rocket,
};

export default function Process() {
  return (
    <section id="process-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -ml-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-24 flex flex-col items-center text-center">
          <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 How We Work
               </span>
             </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl text-white"
          >
            A proven path to scale
          </TextReveal>
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg text-[#b8b8b8] font-light leading-relaxed">
              We transform complex workflows into scalable AI-powered systems — efficiently and strategically. No guesswork.
            </p>
          </FadeIn>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center gradient line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          <div className="space-y-12 md:space-y-24">
            {PROCESS_STEPS.map((step, idx) => {
              const Icon = iconMap[step.icon];
              const isOdd = idx % 2 === 0;

              return (
                <FadeIn
                  key={step.number}
                  direction={isOdd ? "left" : "right"}
                  distance={40}
                  delay={idx * 0.1}
                  className="relative flex flex-col md:flex-row md:items-center group"
                >
                  {/* LEFT side */}
                  <div className={`flex-1 md:w-1/2 ${isOdd ? "md:pr-16 md:text-right" : "md:order-3 md:pl-16"} ml-12 md:ml-0`}>
                     <motion.div 
                        whileHover={{ scale: 1.02 }}
                        transition={cinematicSpring}
                        className="rounded-3xl border border-white/5 bg-[#141414] p-8 shadow-xl relative overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10">
                           <div className="flex items-center gap-4 mb-4 md:hidden">
                              <span className="text-xl font-bold text-white/20">{step.number}</span>
                              <div className="h-px flex-1 bg-white/10" />
                           </div>
                           
                           <h3 className="text-2xl font-medium text-white mb-3">{step.title}</h3>
                           <p className="text-base text-[#b8b8b8] font-light leading-relaxed">
                             {step.description}
                           </p>
                        </div>
                        
                        {/* Abstract visual inside card */}
                        <div className={`absolute ${isOdd ? 'left-[-10%]' : 'right-[-10%]'} bottom-[-20%] opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700`}>
                           <Icon className="w-64 h-64 text-white" />
                        </div>
                     </motion.div>
                  </div>

                  {/* CENTER dot */}
                  <div className="absolute left-0 md:left-1/2 top-8 md:top-1/2 w-8 h-8 -translate-y-1/2 md:-translate-x-1/2 flex items-center justify-center md:order-2 z-10">
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-sm group-hover:bg-accent/40 transition-colors duration-500" />
                    <div className="relative h-4 w-4 rounded-full border-2 border-[#141414] bg-white group-hover:bg-accent group-hover:border-white transition-colors duration-500 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                  </div>

                  {/* RIGHT side empty spacer for alternating layout */}
                  <div className={`hidden md:flex flex-1 md:w-1/2 items-center ${isOdd ? "md:order-3 md:pl-16" : "md:pr-16 md:justify-end"}`}>
                     <div className="flex items-center gap-6">
                        {isOdd ? (
                           <>
                             <span className="text-5xl font-bold tracking-tighter text-white/10">{step.number}</span>
                             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] border border-white/5 group-hover:border-white/20 transition-colors">
                               <Icon className="h-6 w-6 text-white/50" />
                             </div>
                           </>
                        ) : (
                           <>
                             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] border border-white/5 group-hover:border-white/20 transition-colors">
                               <Icon className="h-6 w-6 text-white/50" />
                             </div>
                             <span className="text-5xl font-bold tracking-tighter text-white/10">{step.number}</span>
                           </>
                        )}
                     </div>
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
