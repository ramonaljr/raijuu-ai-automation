"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { cinematicSpring } from "@/components/shared/motion";

const BRAND_NAME = "Raijuu";

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const duration = prefersReduced ? 200 : 2400;
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [prefersReduced]);

  if (prefersReduced) {
    return isVisible ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-bg">
        <Zap className="h-8 w-8 text-white" />
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{
            duration: 0.8,
            ease: [0.76, 0, 0.24, 1],
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-bg"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Logo icon — cinematic scale + rotation entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ ...cinematicSpring, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"
            >
              <Zap className="h-8 w-8 text-white" />
            </motion.div>

            {/* Brand name — letter-by-letter with blur reveal */}
            <div className="flex overflow-hidden">
              {BRAND_NAME.split("").map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    ...cinematicSpring,
                    delay: 0.5 + i * 0.08,
                  }}
                  className="text-4xl font-bold tracking-tight text-white md:text-5xl"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Loading bar — smooth fill */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "120px", opacity: 1 }}
              transition={{
                width: { duration: 1.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.3, delay: 0.4 },
              }}
              className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
