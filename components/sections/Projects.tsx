"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { ArrowUpRight } from "lucide-react";
import SectionBadge from "@/components/ui/SectionBadge";
import { CASE_STUDIES } from "@/lib/constants";
import Link from "next/link";

export default function Projects() {
  return (
    <section id="projects-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <div className="max-w-3xl">
            <FadeIn>
               <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
                 <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                   Case Studies
                 </span>
               </div>
            </FadeIn>
            <TextReveal
              as="h2"
              delay={0.1}
              className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-7xl"
            >
              Hours saved.
              <br /> Revenue added. <span className="text-white/40">Both.</span>
            </TextReveal>
          </div>
          
          <FadeIn delay={0.2} className="md:mb-4">
             <Link
               href="/projects"
               className="group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#141414] px-8 text-sm font-semibold text-white transition-all hover:bg-white hover:text-[#0a0a0a]"
             >
               View All Projects
               <ArrowUpRight className="h-4 w-4" />
             </Link>
          </FadeIn>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-8 md:grid-cols-2">
           {CASE_STUDIES.map((project, idx) => (
             <FadeIn key={idx} delay={idx * 0.1}>
                 <motion.div 
                     whileHover={{ y: -8 }}
                     transition={cinematicSpring}
                     className="group relative flex flex-col rounded-[2.5rem] bg-[#141414] p-3 overflow-hidden border border-white/5"
                 >
                     <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-[#1a1a1a]">
                        {/* Placeholder gradient mimicking Conicorn's high quality abstract imagery */}
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                        <img 
                           src={idx % 2 === 0 ? "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69adaf21aefbcfd4a9ea42b3_case1.png" : "https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69b279981413ea21427cbe4e_case3.png"} 
                           alt={project.title}
                           className="object-cover w-full h-full opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700"
                        />
                     </div>
                     
                     <div className="p-8 pt-10 flex flex-col items-start h-full">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8 pb-8 border-b border-white/10">
                           {project.metrics.map((metric, i) => (
                             <div key={i}>
                               <p className="text-3xl font-medium text-white mb-1">{metric.value}</p>
                               <p className="text-xs text-[#b8b8b8] uppercase tracking-wider">{metric.label}</p>
                             </div>
                           ))}
                        </div>
                        
                        <h3 className="text-3xl font-medium text-white mb-4 transition-colors group-hover:text-accent-light">
                          {project.title}
                        </h3>
                        <p className="text-base text-[#b8b8b8] font-light leading-relaxed max-w-lg">
                          {project.description}
                        </p>
                        
                        <div className="mt-8">
                           <div className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-accent-light transition-colors">
                              Read Case Study
                              <ArrowUpRight className="h-4 w-4" />
                           </div>
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
