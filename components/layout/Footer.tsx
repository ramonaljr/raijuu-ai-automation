"use client";

import { Zap, ArrowUpRight } from "lucide-react";
import { FadeIn, TextReveal, ScaleIn } from "@/components/shared/motion";
import {
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
  XIcon,
} from "@/components/ui/SocialIcons";
import { SOCIAL_LINKS, NAV_ITEMS } from "@/lib/constants";

const socialIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  LinkedIn: LinkedinIcon,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  "Twitter X": XIcon,
};

const footerNavItems = NAV_ITEMS.filter((item) =>
  ["About", "Services", "Projects", "Pricing", "FAQs"].includes(item.label)
);

export default function Footer() {
  return (
    <footer className="relative footer-animated-bg">
      {/* CTA + Form section — centered layout like reference */}
      <div id="CTA-Form" className="mx-auto max-w-6xl px-4 py-24 lg:py-32">
        <div className="flex flex-col items-center">
          {/* Headline — centered above form */}
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Your Competitors Are Automating.
              <br />
              <span className="text-white/50">Are you?</span>
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Stop wasting time on manual processes. Start building a
              self-running business.
            </p>
          </div>

          {/* Contact form — centered frosted glass "phone" card */}
          <ScaleIn initialScale={0.95} className="w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-10">
              <form
                className="space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder="Your name*"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
                />
                <input
                  type="text"
                  placeholder="Your company name*"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
                />
                <input
                  type="email"
                  placeholder="Your business email*"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
                />
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="rounded-full bg-dark-surface px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 cursor-pointer"
                  >
                    Send Your Request!
                  </button>
                </div>
              </form>
            </div>
          </ScaleIn>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Social links — full width row with equal spacing */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {SOCIAL_LINKS.map((social) => {
              const Icon = socialIcons[social.name];
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  {social.name}
                  <ArrowUpRight className="h-3 w-3 text-white/40" />
                </a>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-white/10" />

          {/* Nav links — full width row with equal spacing */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {footerNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex-1 text-center text-sm text-white/50 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Large centered logo */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Zap className="h-10 w-10 text-white/20" />
              <span className="text-4xl font-bold tracking-tight text-white/20 md:text-6xl">
                Raijuu
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/40">
              &copy; Raijuu AI Automation 2026
            </div>
            <div className="text-sm text-white/40">Powered by Raijuu AI</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
