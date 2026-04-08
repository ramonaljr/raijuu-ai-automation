"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { CLIENT_LOGOS } from "@/lib/constants";
import { cinematicSpring } from "@/components/shared/motion";

const HeroBlob = dynamic(() => import("@/components/three/HeroBlob"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-dark-bg" />,
});

// Preloader takes ~2.4s, hero starts animating after
const BASE_DELAY = 2.6;

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const d = prefersReduced ? 0 : BASE_DELAY;

  return (
    <section className="relative min-h-screen overflow-hidden bg-dark-bg">
      {/* 3D Background */}
      <HeroBlob />

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        <div className="flex flex-col items-center text-center">
          {/* Badge — entrance: fade + scale */}
          <motion.div
            initial={
              prefersReduced
                ? false
                : { opacity: 0, scale: 0.8, y: 20 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d + 0.0 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium uppercase tracking-wider text-white/80">
              Raijuu AI Automation
            </span>
          </motion.div>

          {/* Headline — entrance: blur reveal + rise */}
          <motion.h1
            initial={
              prefersReduced
                ? false
                : { opacity: 0, y: 40, filter: "blur(10px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...cinematicSpring, delay: d + 0.2 }}
            className="mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight text-gradient-hero md:text-7xl lg:text-8xl"
          >
            Intelligent Automation
            <br />
            for Modern Teams
          </motion.h1>

          {/* Subtitle — entrance: fade + rise */}
          <motion.p
            initial={prefersReduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d + 0.4 }}
            className="mb-10 max-w-xl text-lg text-white/60"
          >
            We build AI-powered automation systems that eliminate manual work,
            reduce costs, and multiply your business performance.
          </motion.p>

          {/* CTAs — entrance: fade + rise */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicSpring, delay: d + 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#service-section"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-500 hover:bg-white/20 active:scale-[0.97]"
            >
              Explore Services
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </a>
            <a
              href="#CTA-Form"
              className="inline-flex items-center gap-3 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-500 hover:bg-white/20 active:scale-[0.97]"
            >
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400" />
              </div>
              Work with Us
            </a>
          </motion.div>
        </div>

        {/* Logo carousel — last to enter */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: d + 1.0 }}
          className="absolute bottom-8 left-0 right-0 overflow-hidden"
        >
          <div className="hero-mask">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
                <div
                  key={i}
                  className="mx-8 flex items-center text-lg font-semibold text-white/30"
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
