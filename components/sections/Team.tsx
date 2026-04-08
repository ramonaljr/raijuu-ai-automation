"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn, TextReveal, ScaleIn } from "@/components/shared/motion";
import {
  FacebookIcon,
  LinkedinIcon,
  XIcon,
} from "@/components/ui/SocialIcons";
import SectionBadge from "@/components/ui/SectionBadge";
import { TEAM_MEMBERS } from "@/lib/constants";

export default function Team() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(el.scrollLeft / maxScroll);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="team-section" className="bg-white py-24 lg:py-32">
      {/* Header — centered */}
      <div className="mb-16 flex flex-col items-center text-center px-4">
        <FadeIn>
          <SectionBadge number="009" label="team" />
        </FadeIn>
        <TextReveal
          as="h2"
          delay={0.1}
          className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
        >
          Meet the Raijuu Team
        </TextReveal>
      </div>

      {/* Team carousel — with side padding matching container */}
      <div
        ref={scrollRef}
        className="no-scrollbar mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 snap-x snap-mandatory lg:px-8"
      >
        {TEAM_MEMBERS.map((member) => (
          <ScaleIn
            key={member.name}
            initialScale={0.9}
            className="w-64 flex-shrink-0 snap-start md:w-72"
          >
            <div className="group relative overflow-hidden rounded-2xl">
              {/* Image placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-400 transition-transform duration-1000 group-hover:scale-105" />

              {/* Social links overlay */}
              <div className="absolute left-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={member.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                >
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={member.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                >
                  <LinkedinIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={member.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:bg-white"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Name & role */}
            <div className="mt-4">
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-muted">({member.role})</p>
            </div>
          </ScaleIn>
        ))}
      </div>

      {/* Rainbow progress bar + nav arrows */}
      <div className="mx-auto mt-8 flex max-w-6xl items-center justify-between px-4">
        {/* Rainbow progress bar */}
        <div className="relative h-1 flex-1 max-w-md overflow-hidden rounded-full bg-gray-200">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${Math.max(scrollProgress * 100, 10)}%` }}
          />
        </div>

        {/* Nav arrows — bottom right */}
        <div className="flex gap-2 ml-6">
          <button
            onClick={() => scroll("left")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-surface text-white transition-transform hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-surface text-white transition-transform hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
