"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useReducedMotion,
  type Transition,
} from "framer-motion";

// ─── Spring Physics Profiles ───────────────────────────────

export const cinematicSpring: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 100,
  mass: 1.2,
};

export const countupSpring: Transition = {
  type: "spring",
  damping: 40,
  stiffness: 80,
  mass: 1,
};

export const snappySpring: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 200,
};

const EASING_FALLBACK = [0.25, 0.1, 0.25, 1] as const;

// ─── FadeIn ────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

const directionMap = {
  up: { y: 1, x: 0 },
  down: { y: -1, x: 0 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
};

export function FadeIn({
  children,
  className,
  direction = "up",
  distance = 60,
  delay = 0,
  duration,
  once = true,
  amount = 0.2,
}: FadeInProps) {
  const prefersReduced = useReducedMotion();
  const dir = directionMap[direction];

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const transition = duration
    ? { duration, ease: EASING_FALLBACK, delay }
    : { ...cinematicSpring, delay };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: dir.x * distance, y: dir.y * distance }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleIn ───────────────────────────────────────────────

interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  initialScale?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}

export function ScaleIn({
  children,
  className,
  initialScale = 0.9,
  delay = 0,
  once = true,
  amount = 0.2,
}: ScaleInProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: initialScale }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ ...cinematicSpring, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── TextReveal ────────────────────────────────────────────

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export function TextReveal({
  children,
  className,
  delay = 0,
  as = "div",
}: TextRevealProps) {
  const prefersReduced = useReducedMotion();
  const Component = motion[as];

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...cinematicSpring, delay }}
    >
      {children}
    </Component>
  );
}

// ─── StaggerChildren + StaggerItem ─────────────────────────

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
  amount?: number;
}

export function StaggerChildren({
  children,
  className,
  stagger = 0.15,
  once = true,
  amount = 0.2,
}: StaggerChildrenProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: 0.1 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}

export function StaggerItem({
  children,
  className,
  direction = "up",
  distance = 50,
}: StaggerItemProps) {
  const dir = directionMap[direction];

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, x: dir.x * distance, y: dir.y * distance },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: cinematicSpring,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── ParallaxLayer ─────────────────────────────────────────

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down";
}

export function ParallaxLayer({
  children,
  className,
  speed = 0.2,
  direction = "up",
}: ParallaxLayerProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const multiplier = direction === "up" ? -1 : 1;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [multiplier * speed * 200, multiplier * speed * -200]
  );
  const smoothY = useSpring(y, { damping: 30, stiffness: 100 });

  if (prefersReduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: smoothY }}>{children}</motion.div>
    </div>
  );
}

// ─── CountUp ───────────────────────────────────────────────

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
  className,
}: CountUpProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);

  const springValue = useSpring(0, {
    damping: 40,
    stiffness: 80,
    mass: 1,
  });

  useEffect(() => {
    if (isInView) {
      springValue.set(target);
    }
  }, [isInView, target, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [springValue]);

  if (prefersReduced) {
    return (
      <span ref={ref} className={className}>
        {prefix}
        {target.toFixed(decimals)}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── SectionReveal (convenience wrapper) ───────────────────

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SectionReveal({
  children,
  className,
  delay = 0,
}: SectionRevealProps) {
  return (
    <ScaleIn
      className={className}
      initialScale={0.97}
      delay={delay}
      amount={0.1}
    >
      {children}
    </ScaleIn>
  );
}
