"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, StaggerChildren, StaggerItem, cinematicSpring } from "@/components/shared/motion";
import SectionBadge from "@/components/ui/SectionBadge";

const FEATURES = [
  {
    title: "AI-Driven Efficiency",
    description: "Our proprietary AI engines analyze your workflows and automate repetitive tasks with zero human intervention.",
    icon: "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69ad5e0ecfc53553c40c5a76_Cap%20Data%201.svg",
  },
  {
    title: "Seamless Integration",
    description: "Connect instantly with your favorite tools. We native support over 50+ enterprise platforms out of the box.",
    icon: "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69ad5e0ed569da6b4b8271fd_Cap%20Data%202.svg",
  },
  {
    title: "Bank-Grade Security",
    description: "Your data is encrypted at rest and in transit. Complying with SOC2, GDPR, and HIPAA standards.",
    icon: "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69ad5e0e8ca936a8b0b6d20e_Cap%20Data%203.svg",
  },
  {
    title: "Real-Time Analytics",
    description: "Monitor performance through dynamic dashboards. Understand exactly where time and money are being saved.",
    icon: "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69ad5e0e174e21ee2776436c_Cap%20Data%204.svg",
  },
];

export default function About() {
  return (
    <section id="about-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      {/* Background glow for depth */}
      <div className="absolute top-0 right-0 -mr-40 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-20 mb-20">
          <div className="max-w-2xl flex-1">
            <FadeIn>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                  Why Choose Us?
                </span>
              </div>
            </FadeIn>
            
            <TextReveal
              as="h2"
              delay={0.1}
              className="text-4xl font-medium leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl"
            >
              Built to scale your operations effortlessly.
            </TextReveal>
          </div>
          
          <div className="max-w-md flex-1">
             <TextReveal
               as="p"
               delay={0.2}
               className="text-lg text-[#b8b8b8] font-light leading-relaxed"
             >
               We combine cutting-edge artificial intelligence with deep operational expertise to build systems that don&apos;t just augment your team—they multiply your entire company&apos;s output.
             </TextReveal>
          </div>
        </div>

        {/* Features Grid - Glassmorphism mapping */}
        <StaggerChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {FEATURES.map((feature, i) => (
            <StaggerItem key={i}>
              <motion.div 
                whileHover={{ y: -8, scale: 1.02 }}
                transition={cinematicSpring}
                className="group relative h-full rounded-3xl border border-white/5 bg-[#141414] p-8 shadow-xl overflow-hidden"
              >
                 {/* Hover Highlight Gradient */}
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-8 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                      <img src={feature.icon} alt={feature.title} className="w-8 h-8 object-contain" />
                    </div>
                    
                    <h3 className="text-xl font-medium text-white tracking-tight mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-[#b8b8b8] font-light leading-relaxed mt-auto">
                      {feature.description}
                    </p>
                 </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
