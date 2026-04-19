"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { TESTIMONIALS } from "@/lib/constants";
import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section id="testimonials-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        <div className="mb-20 flex flex-col items-center text-center">
          <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 Testimonials
               </span>
             </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            What They&apos;re Saying
          </TextReveal>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
           {TESTIMONIALS.map((t, idx) => (
             <FadeIn key={idx} delay={(idx % 5) * 0.1} className="break-inside-avoid">
                 <motion.div 
                     whileHover={{ y: -4 }}
                     transition={cinematicSpring}
                     className="rounded-3xl border border-white/5 bg-[#141414] p-8 shadow-xl"
                 >
                    <Quote className="h-8 w-8 text-accent/50 mb-6" />
                    <p className="text-[#cdcdcd] font-light leading-relaxed mb-8 text-lg">
                       &quot;{t.quote}&quot;
                    </p>
                    <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-[#1a1a1a]">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${t.name}`} alt={t.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-white">{t.name}</h4>
                           <p className="text-xs text-[#b8b8b8]">{t.role}</p>
                        </div>
                    </div>
                 </motion.div>
             </FadeIn>
           ))}
        </div>
      </div>
    </section>
  );
}
