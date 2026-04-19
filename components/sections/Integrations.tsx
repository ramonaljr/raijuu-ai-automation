"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal } from "@/components/shared/motion";
import { INTEGRATION_ROWS } from "@/lib/constants";

export default function Integrations() {
  return (
    <section id="integrations-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8 text-center mb-20">
         <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 Integrations
               </span>
             </div>
         </FadeIn>
         <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl max-w-4xl mx-auto"
          >
            Connects with your entire technology ecosystem
          </TextReveal>
      </div>

      <div className="relative z-10 hero-mask overflow-hidden flex flex-col gap-8">
        {INTEGRATION_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex flex-nowrap overflow-hidden">
            <motion.div
              initial={{ x: rIdx % 2 === 0 ? "0%" : "-50%" }}
              animate={{ x: rIdx % 2 === 0 ? "-50%" : "0%" }}
              transition={{ repeat: Infinity, ease: "linear", duration: 50 }}
              className="flex gap-8 items-center min-w-max"
            >
               {[...row, ...row, ...row].map((app, i) => (
                 <div
                   key={`${app}-${i}`}
                   className="flex h-20 w-48 shrink-0 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#141414] px-6 py-4 shadow-xl transition-all hover:bg-white/5 hover:scale-105 cursor-pointer backdrop-blur-sm"
                 >
                   <span className="text-lg font-semibold text-[#cdcdcd] grayscale group-hover:grayscale-0 transition-all">{app}</span>
                 </div>
               ))}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
