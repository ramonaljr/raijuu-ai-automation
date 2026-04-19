"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { CLIENT_LOGOS } from "@/lib/constants";
import { cinematicSpring } from "@/components/shared/motion";

const HeroBlob = dynamic(() => import("@/components/three/HeroBlob"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-dark-bg" />,
});

const BASE_DELAY = 1.0;

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const d = prefersReduced ? 0 : BASE_DELAY;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0a0a0a] pt-32 pb-20">
      {/* Abstract Background Ring / Glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/10 blur-[150px] opacity-50 z-0 pointer-events-none" />
      <HeroBlob />

      <div className="container relative z-10 mx-auto px-4 lg:px-8 pt-10">
        <div className="flex flex-col items-center text-center">
          
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d }}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#141414]/80 pr-4 pl-1 py-1 backdrop-blur-md"
          >
            <div className="flex h-8 items-center rounded-full bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-[#0a0a0a]">
              New Feature
            </div>
            <span className="text-sm font-medium text-white/80">
              Meet our latest AI Engine
            </span>
            <ArrowRight className="h-4 w-4 text-white/50" />
          </motion.div>

          <motion.h1
            initial={prefersReduced ? false : { opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...cinematicSpring, delay: d + 0.2 }}
            className="mb-6 max-w-5xl text-5xl font-medium leading-[1.05] tracking-[-0.04em] text-white md:text-7xl lg:text-[6rem]"
          >
            Intelligent Automation
            <br />
            <span className="text-white/40">for Modern Teams</span>
          </motion.h1>

          <motion.p
            initial={prefersReduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d + 0.4 }}
            className="mb-10 max-w-2xl text-lg lg:text-xl text-white/50 leading-relaxed font-light"
          >
            We build out-of-the-box AI workflows that eliminate manual work,
            reduce operational costs, and instantly multiply your business performance.
          </motion.p>

          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d + 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/demo"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[#0a0a0a] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <button className="group inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/10 bg-[#141414] px-8 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-[#0a0a0a] transition-colors">
                <Play className="h-3 w-3 fill-current" />
              </div>
              Watch Video
            </button>
          </motion.div>
        </div>

        {/* Hero Mockup or floating cards */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...cinematicSpring, delay: d + 0.8 }}
          className="relative mt-24 mx-auto max-w-5xl"
        >
          <div className="relative aspect-video w-full rounded-[2rem] border border-white/10 bg-[#141414] p-3 shadow-2xl overflow-hidden group">
             {/* Glow behind video/image */}
             <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
             
             <div className="relative h-full w-full rounded-2xl bg-[#0a0a0a] overflow-hidden border border-white/5">
                 <img src="https://cdn.prod.website-files.com/69abbb96278770785e4b2dc1/69adaf50e18e0a6c61e5932b_caseimg1.png" alt="App Dashboard" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white text-white hover:text-[#0a0a0a] hover:scale-110 transition-all duration-300">
                      <Play className="h-8 w-8 ml-1 fill-current" />
                   </div>
                 </div>
             </div>
          </div>
        </motion.div>

        {/* Logo Carousel */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: d + 1.2 }}
          className="mt-32 pt-10"
        >
          <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-white/30 mb-8">
            Trusted by innovative teams worldwide
          </p>
          <div className="hero-mask overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap items-center">
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
                <div
                  key={i}
                  className="mx-12 flex items-center text-xl font-bold text-white/20 grayscale transition-all hover:grayscale-0 hover:text-white"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
