'use client';

import { motion } from 'framer-motion';
import { substituteTemplate } from '@/lib/demo/submission';
import { type DemoContent, type Industry } from '@/lib/demo/content';

import general from '@/content/demos/general.json';
import realEstate from '@/content/demos/real-estate.json';
import ecommerce from '@/content/demos/ecommerce.json';
import saas from '@/content/demos/saas.json';
import agency from '@/content/demos/agency.json';
import healthcare from '@/content/demos/healthcare.json';
import professionalServices from '@/content/demos/professional-services.json';

const CONTENT: Record<Industry, DemoContent> = {
  general: general as DemoContent,
  'real-estate': realEstate as DemoContent,
  ecommerce: ecommerce as DemoContent,
  saas: saas as DemoContent,
  agency: agency as DemoContent,
  healthcare: healthcare as DemoContent,
  'professional-services': professionalServices as DemoContent,
};

function loadContent(industry: string): DemoContent {
  return CONTENT[industry as Industry] ?? CONTENT.general;
}

export function DemoResult({
  industry,
  situationText,
}: {
  industry: string;
  situationText: string;
}) {
  const content = loadContent(industry);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div>
        <p className="mb-1 text-sm uppercase tracking-widest text-white/50">
          Analysis complete
        </p>
        <h2 className="text-2xl font-semibold">
          Here&apos;s what Raijuu would build for a {content.displayName} operator like you.
        </h2>
      </div>

      <div className="space-y-4">
        {content.cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.2 }}
            className="rounded-lg border border-dark-border bg-dark-surface p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{card.title}</h3>
              <span className="rounded border border-accent/20 bg-accent/5 px-2 py-0.5 text-xs text-accent">
                {card.metric}
              </span>
            </div>
            <p
              className="text-sm leading-relaxed text-white/60"
              dangerouslySetInnerHTML={{
                __html: substituteTemplate(card.body, situationText, content.displayName),
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="border-t border-dark-border pt-10">
        <p className="mb-4 text-lg">{content.ctaLine}</p>
        <CalBooking />
      </div>
    </motion.div>
  );
}

function CalBooking() {
  const username = process.env.NEXT_PUBLIC_CAL_USERNAME;
  if (!username) {
    return (
      <div className="rounded border border-yellow-900 bg-yellow-950/30 p-4 text-sm text-yellow-200">
        Booking not configured yet (set <code>NEXT_PUBLIC_CAL_USERNAME</code> in env).
      </div>
    );
  }
  return (
    <a
      href={`https://cal.com/${username}/30min?overlayCalendar=true`}
      target="_blank"
      rel="noreferrer"
      className="inline-block rounded bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-light"
    >
      Book a 30-minute call →
    </a>
  );
}
