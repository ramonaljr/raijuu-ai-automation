"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { PRICING_PLANS } from "@/lib/constants";
import { Check, ArrowRight } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        <div className="mb-20 flex flex-col items-center text-center">
          <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 Pricing
               </span>
             </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Pick where you&apos;re stuck.
          </TextReveal>
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg text-[#b8b8b8] font-light leading-relaxed">
              One bundled system instead of a fragmented SaaS stack. Plans below are monthly starting prices — exact scope and terms confirmed on the fit call.
            </p>
          </FadeIn>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {PRICING_PLANS.monthly.map((plan, idx) => {
            const isPopular = plan.popular;
            return (
              <FadeIn key={plan.name} delay={idx * 0.1}>
                 <motion.div 
                     whileHover={{ y: -8 }}
                     transition={cinematicSpring}
                     className={`relative flex flex-col h-full rounded-3xl p-10 ${
                       isPopular 
                         ? 'bg-white shadow-2xl scale-105 z-10' 
                         : 'bg-[#141414] border border-white/5'
                     }`}
                 >
                    {isPopular && (
                      <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                         <span className="bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg rounded-full">
                           Most Popular
                         </span>
                      </div>
                    )}
                    
                    <div className="mb-8">
                       <h3 className={`text-2xl font-medium mb-3 ${isPopular ? 'text-[#0a0a0a]' : 'text-white'}`}>
                          {plan.name}
                       </h3>
                       <p className={`text-sm ${isPopular ? 'text-[#0a0a0a]/70' : 'text-[#b8b8b8]'}`}>
                          {plan.description}
                       </p>
                    </div>

                    <div className="mb-8 flex items-baseline gap-2">
                       <span className={`text-5xl font-medium tracking-tight ${isPopular ? 'text-[#0a0a0a]' : 'text-white'}`}>
                          {plan.price}
                       </span>
                       {plan.period && <span className={`text-sm ${isPopular ? 'text-[#0a0a0a]/70' : 'text-[#b8b8b8]'}`}>{plan.period}</span>}
                    </div>

                    <ul className="mb-10 space-y-4 flex-1">
                       {plan.features.map(f => (
                         <li key={f} className={`flex items-start gap-3 text-sm font-medium ${isPopular ? 'text-[#0a0a0a]/80' : 'text-[#cdcdcd]'}`}>
                            <div className={`mt-0.5 rounded-full p-1 ${isPopular ? 'bg-[#0a0a0a]/10' : 'bg-white/10'}`}>
                              <Check className={`h-3 w-3 ${isPopular ? 'text-[#0a0a0a]' : 'text-white'}`} />
                            </div>
                            {f}
                         </li>
                       ))}
                    </ul>

                    <a
                      href="#"
                      className={`group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold transition-all ${
                         isPopular 
                           ? 'bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]' 
                           : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {plan.cta || "Get Started"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                 </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
