'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitDemo, type SubmitDemoResult } from './actions';
import { DemoResult } from './DemoResult';
import { SUPPORTED_INDUSTRIES, type Industry } from '@/lib/demo/content';

type Step = 'form' | 'analyzing' | 'result' | 'error';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function DemoFlow() {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState<Industry>('general');
  const [situationText, setSituationText] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [result, setResult] = useState<SubmitDemoResult | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    (window as unknown as { onTurnstileCallback?: (token: string) => void }).onTurnstileCallback = (
      token: string,
    ) => setTurnstileToken(token);
    return () => {
      delete (window as unknown as { onTurnstileCallback?: (token: string) => void })
        .onTurnstileCallback;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('analyzing');
    const fd = new FormData();
    fd.set('email', email);
    fd.set('industry', industry);
    fd.set('situationText', situationText);
    fd.set('turnstileToken', turnstileToken);
    const r = await submitDemo(fd);
    setResult(r);
    // Artificial delay so the "analyzing" animation always plays for at least 2s
    await new Promise((res) => setTimeout(res, 2000));
    setStep(r.ok ? 'result' : 'error');
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'form' && (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          <label className="block">
            <span className="mb-1 block text-sm text-white/60">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-dark-border bg-dark-surface px-3 py-2 outline-none transition-colors focus:border-accent"
              placeholder="you@company.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/60">Industry</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className="w-full rounded border border-dark-border bg-dark-surface px-3 py-2 outline-none transition-colors focus:border-accent"
            >
              {SUPPORTED_INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/60">
              What&apos;s chewing up your team&apos;s time? ({situationText.length}/280)
            </span>
            <textarea
              required
              minLength={10}
              maxLength={280}
              value={situationText}
              onChange={(e) => setSituationText(e.target.value)}
              rows={4}
              className="w-full rounded border border-dark-border bg-dark-surface px-3 py-2 outline-none transition-colors focus:border-accent"
              placeholder="e.g. My team manually pastes Shopify order data into Airtable every day..."
            />
          </label>
          {TURNSTILE_SITE_KEY && (
            <>
              <div
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-callback="onTurnstileCallback"
              />
              <script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                async
                defer
              />
            </>
          )}
          <button
            type="submit"
            disabled={situationText.length < 10}
            className="w-full rounded bg-accent py-3 font-semibold text-white transition-opacity hover:bg-accent-light disabled:opacity-50"
          >
            Run analysis
          </button>
        </motion.form>
      )}

      {step === 'analyzing' && (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center gap-4 py-24"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-dark-border border-t-accent" />
          <p className="text-white/60">Analyzing your situation…</p>
        </motion.div>
      )}

      {step === 'result' && result?.ok && (
        <DemoResult
          key="result"
          industry={result.industry}
          situationText={situationText}
        />
      )}

      {step === 'error' && result && !result.ok && (
        <DemoError key="error" error={result.error} onRetry={() => setStep('form')} />
      )}
    </AnimatePresence>
  );
}

function DemoError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const messages: Record<string, string> = {
    'rate-limited':
      "You've tried the demo 3 times in the last hour. Give it a bit and come back.",
    bot: "Our bot check didn't like that. Refresh and try once more.",
    invalid: 'Something in the form looked off. Double-check email + situation.',
    server: 'Our side coughed. Try again in a moment.',
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-16 text-center"
    >
      <p className="mb-4 text-xl">Couldn&apos;t run that analysis.</p>
      <p className="mb-8 text-white/60">{messages[error] ?? 'Unknown error.'}</p>
      <button
        onClick={onRetry}
        className="rounded bg-accent px-6 py-2 font-semibold text-white transition-opacity hover:bg-accent-light"
      >
        Try again
      </button>
    </motion.div>
  );
}

