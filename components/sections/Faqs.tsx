"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { FAQS } from "@/lib/constants";
import Link from "next/link";

export default function Faqs() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        <div className="mb-20 flex flex-col items-center text-center">
          <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 FAQ
               </span>
             </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Common Questions
          </TextReveal>
        </div>

        <div className="mx-auto max-w-4xl">
           <div className="flex flex-col gap-4">
             {FAQS.map((faq, idx) => {
                const isOpen = openIdx === idx;
                
                return (
                  <FadeIn key={idx} delay={idx * 0.1}>
                    <motion.div 
                      className={`overflow-hidden rounded-3xl border transition-colors duration-500 bg-[#141414] ${
                        isOpen ? "border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "border-white/5 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIdx(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-6 md:p-8 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <span className={`text-lg font-medium tracking-tight transition-colors ${isOpen ? "text-white" : "text-[#b8b8b8]"}`}>
                           {faq.question}
                        </span>
                        <div className={`ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-white text-[#0a0a0a]" : "bg-white/5 text-white/50"}`}>
                           {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                          >
                            <div className="px-6 pb-8 md:px-8 pt-0">
                               <p className="text-[#b8b8b8] font-light leading-relaxed max-w-3xl">
                                 {faq.answer}
                               </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </FadeIn>
                );
             })}
           </div>
        </div>

        {/* Huge Call to Action mimicking Conicorn */}
        <div className="mt-40">
           <FadeIn>
              <motion.div 
                 whileHover={{ y: -5 }}
                 transition={cinematicSpring}
                 className="relative w-full rounded-[3rem] bg-[#141414] p-12 md:p-20 overflow-hidden border border-white/5 text-center flex flex-col items-center justify-center"
              >
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 max-w-4xl mx-auto">
                     <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8">
                       Your competitors are automating. <span className="text-white/40">Are you?</span>
                     </h2>
                     <p className="text-lg text-[#b8b8b8] font-light mb-12 max-w-2xl mx-auto">
                       Stop losing time to manual tasks. Let&apos;s build intelligent automated systems that completely transform your daily operations.
                     </p>
                     
                     <Link
                       href="/demo"
                       className="group inline-flex h-16 items-center justify-center gap-2 rounded-full bg-white px-10 text-lg font-semibold text-[#0a0a0a] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                     >
                       Start Automating Now
                       <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                     </Link>
                  </div>
              </motion.div>
           </FadeIn>
        </div>
      </div>
    </section>
  );
}
