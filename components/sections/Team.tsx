"use client";

import { motion } from "framer-motion";
import { FadeIn, TextReveal, cinematicSpring } from "@/components/shared/motion";
import { TEAM_MEMBERS } from "@/lib/constants";
import { Send, Mail } from "lucide-react";

export default function Team() {
  return (
    <section id="team-section" className="relative bg-[#0a0a0a] py-32 overflow-hidden border-t border-white/5">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        
        <div className="mb-20 flex flex-col items-center text-center">
          <FadeIn>
             <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
               <span className="text-xs font-semibold uppercase tracking-widest text-[#cdcdcd]">
                 The Team
               </span>
             </div>
          </FadeIn>
          <TextReveal
            as="h2"
            delay={0.1}
            className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Small team. <span className="text-white/40">Same faces, 90 days in.</span>
          </TextReveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
           {TEAM_MEMBERS.map((member, idx) => (
             <FadeIn key={member.name} delay={idx * 0.1}>
                 <motion.div 
                     whileHover={{ y: -8 }}
                     transition={cinematicSpring}
                     className="group flex flex-col rounded-3xl border border-white/5 bg-[#141414] p-4 h-full"
                 >
                    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-[#1a1a1a] mb-6">
                       <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`}
                          alt={`${member.name}, ${member.role} at Raijuu`}
                          className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500 group-hover:scale-105 opacity-80"
                       />

                       {/* Social overlay */}
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                           <div className="flex gap-4">
                              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-[#0a0a0a] text-white cursor-pointer transition-colors">
                                 <Send className="h-4 w-4" />
                              </div>
                              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-[#0a0a0a] text-white cursor-pointer transition-colors">
                                 <Mail className="h-4 w-4" />
                              </div>
                           </div>
                       </div>
                    </div>
                    
                    <div className="text-center pb-4">
                       <h3 className="text-xl font-medium text-white mb-1 group-hover:text-accent-light transition-colors">{member.name}</h3>
                       <p className="text-sm font-light text-[#b8b8b8]">{member.role}</p>
                    </div>
                 </motion.div>
             </FadeIn>
           ))}
        </div>
      </div>
    </section>
  );
}
