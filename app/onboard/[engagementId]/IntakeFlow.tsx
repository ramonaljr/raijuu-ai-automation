'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitIntake, type SubmitIntakeResult } from './actions';
import { KNOWN_TOOLS } from '@/lib/intake/schema';

// Persist form + step across refresh / browser back. Keyed by engagementId so
// two engagements on the same browser don't overwrite each other. Session-
// (not local-) scoped so a shared browser doesn't leak answers to a later tab.
const STORAGE_KEY_PREFIX = 'raijuu-intake-v1:';

type EditStep = 1 | 2 | 3 | 4 | 5;

type PersistedState = {
  step: EditStep;
  form: FormState;
};

function loadPersisted(engagementId: number): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + engagementId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Guard against stale data with transient step states (submitting/error/done)
    // written before the validation below was added.
    if (![1, 2, 3, 4, 5].includes(parsed.step as number)) return null;
    return parsed;
  } catch {
    return null;
  }
}

type Step = 1 | 2 | 3 | 4 | 5 | 'submitting' | 'done' | 'error';

type FormState = {
  companyName: string;
  role: string;
  tools: string[];
  customTools: string;
  credentialsVaultUrl: string;
  goals: [string, string, string];
  successMetric: string;
  constraints: string;
};

const TOOL_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  hubspot: 'HubSpot',
  'google-sheets': 'Google Sheets',
  airtable: 'Airtable',
  notion: 'Notion',
  zapier: 'Zapier',
  stripe: 'Stripe',
  shopify: 'Shopify',
  intercom: 'Intercom',
  zendesk: 'Zendesk',
  calendly: 'Calendly',
  linear: 'Linear',
};

export function IntakeFlow({
  engagementId,
  token,
  companyName,
}: {
  engagementId: number;
  token: string;
  companyName: string;
}) {
  const persisted = loadPersisted(engagementId);
  const [step, setStep] = useState<Step>(persisted?.step ?? 1);
  const [result, setResult] = useState<SubmitIntakeResult | null>(null);
  const [form, setForm] = useState<FormState>(
    persisted?.form ?? {
      companyName,
      role: '',
      tools: [],
      customTools: '',
      credentialsVaultUrl: '',
      goals: ['', '', ''],
      successMetric: '',
      constraints: '',
    },
  );

  // Save on every change while the user is still editing. Clear once the
  // flow reaches a terminal state — and never persist transient states like
  // 'submitting' / 'error', which would restore into a broken UI on reload.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = STORAGE_KEY_PREFIX + engagementId;
    if (step === 'done') {
      sessionStorage.removeItem(key);
      return;
    }
    const isEditStep = step === 1 || step === 2 || step === 3 || step === 4 || step === 5;
    if (!isEditStep) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ step, form }));
    } catch {
      // Quota errors are fine to swallow — persistence is best-effort UX.
    }
  }, [engagementId, step, form]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleTool(tool: string) {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }));
  }

  function setGoal(i: 0 | 1 | 2, v: string) {
    setForm((f) => {
      const next = [...f.goals] as [string, string, string];
      next[i] = v;
      return { ...f, goals: next };
    });
  }

  // Per-step validation
  const step1Valid = form.companyName.trim().length >= 2 && form.role.trim().length >= 2;
  const step2Valid = form.tools.length >= 1;
  const step3Valid =
    form.credentialsVaultUrl.length === 0 || /^https?:\/\//.test(form.credentialsVaultUrl);
  const step4Valid = form.goals.every((g) => g.trim().length >= 5);
  const step5Valid = form.successMetric.trim().length >= 10;

  async function handleFinalSubmit() {
    setStep('submitting');
    const fd = new FormData();
    fd.set('engagementId', String(engagementId));
    fd.set('token', token);
    fd.set(
      'payload',
      JSON.stringify({
        ...form,
        customTools: form.customTools.trim() || undefined,
        credentialsVaultUrl: form.credentialsVaultUrl.trim() || undefined,
        constraints: form.constraints.trim() || undefined,
      }),
    );
    const res = await submitIntake(fd);
    setResult(res);
    if (res.ok) {
      setStep('done');
    } else {
      setStep('error');
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Raijuu onboarding</p>
          <h1 className="text-3xl font-semibold">Welcome, {companyName}</h1>
          {typeof step === 'number' && <StepIndicator current={step} total={5} />}
        </header>

        <div className="rounded-lg border border-dark-border bg-dark-surface p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="mb-1 text-xl font-semibold">Let&apos;s confirm who we&apos;re working with</h2>
                  <p className="text-sm text-white/60">
                    We prefilled your company. Tell us who we&apos;re talking to.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Company name</span>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Your role</span>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => update('role', e.target.value)}
                    placeholder="e.g. Head of Ops, Founder, COO"
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <NavRow
                  canAdvance={step1Valid}
                  onNext={() => setStep(2)}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="mb-1 text-xl font-semibold">What tools does your team live in?</h2>
                  <p className="text-sm text-white/60">
                    Pick everything you actively use. This shapes what we can automate first.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {KNOWN_TOOLS.map((tool) => {
                    const selected = form.tools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`rounded border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? 'border-accent bg-accent/10 text-white'
                            : 'border-dark-border bg-dark-bg text-white/70 hover:border-white/30'
                        }`}
                      >
                        {TOOL_LABELS[tool] ?? tool}
                      </button>
                    );
                  })}
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">
                    Other tools (comma-separated, optional)
                  </span>
                  <input
                    type="text"
                    value={form.customTools}
                    onChange={(e) => update('customTools', e.target.value)}
                    placeholder="e.g. Pipedrive, ClickUp, Retool"
                    maxLength={200}
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <NavRow
                  canAdvance={step2Valid}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  advanceHint={!step2Valid ? 'Pick at least one tool' : undefined}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="mb-1 text-xl font-semibold">How should we share credentials?</h2>
                  <p className="text-sm text-white/60">
                    Paste a 1Password share URL, Doppler invite, or similar vault link. We never
                    store secrets in our DB &mdash; just a pointer. Leave blank if you&apos;d rather
                    coordinate over a call.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Vault link (optional)</span>
                  <input
                    type="url"
                    value={form.credentialsVaultUrl}
                    onChange={(e) => update('credentialsVaultUrl', e.target.value)}
                    placeholder="https://share.1password.com/…"
                    maxLength={500}
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <NavRow
                  canAdvance={step3Valid}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                  advanceHint={!step3Valid ? 'That doesn\u2019t look like a valid URL' : undefined}
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="s4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="mb-1 text-xl font-semibold">Your top 3 target automations</h2>
                  <p className="text-sm text-white/60">
                    What&apos;s burning the most hours? Short descriptions are fine &mdash; we&apos;ll
                    follow up to scope. All three are required.
                  </p>
                </div>

                {([0, 1, 2] as const).map((i) => (
                  <label key={i} className="block">
                    <span className="mb-1 block text-sm text-white/60">Goal {i + 1}</span>
                    <textarea
                      value={form.goals[i]}
                      onChange={(e) => setGoal(i, e.target.value)}
                      rows={3}
                      maxLength={200}
                      placeholder={
                        i === 0
                          ? 'e.g. Auto-tag incoming support tickets by product area'
                          : i === 1
                            ? 'e.g. Push paid Stripe invoices into QuickBooks nightly'
                            : 'e.g. Summarize weekly sales calls from Gong into Slack'
                      }
                      className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                    />
                  </label>
                ))}

                <NavRow
                  canAdvance={step4Valid}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                  advanceHint={!step4Valid ? 'Each goal needs at least 5 characters' : undefined}
                />
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="s5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="mb-1 text-xl font-semibold">How will we know it&apos;s working?</h2>
                  <p className="text-sm text-white/60">
                    Tell us the single number or behavior that proves these automations earn their
                    keep. Anything we should avoid or work around?
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">
                    Success metric ({form.successMetric.length}/300)
                  </span>
                  <textarea
                    value={form.successMetric}
                    onChange={(e) => update('successMetric', e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="e.g. Cut the weekly ops sync from 90 minutes to under 15"
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">
                    Constraints, red lines, or context (optional)
                  </span>
                  <textarea
                    value={form.constraints}
                    onChange={(e) => update('constraints', e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. No tools that leave our AWS region; no customer data in third-party LLMs"
                    className="w-full rounded border border-dark-border bg-dark-bg px-3 py-2 outline-none transition-colors focus:border-accent"
                  />
                </label>

                <NavRow
                  canAdvance={step5Valid}
                  submitLabel="Submit intake"
                  onBack={() => setStep(4)}
                  onNext={handleFinalSubmit}
                  advanceHint={
                    !step5Valid ? 'Success metric needs at least 10 characters' : undefined
                  }
                />
              </motion.div>
            )}

            {step === 'submitting' && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-24"
              >
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-dark-border border-t-accent" />
                <p className="text-white/60">Submitting&hellip;</p>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <p className="mb-3 text-2xl font-semibold">You&apos;re in.</p>
                <p className="mx-auto max-w-md text-white/60">
                  We&apos;ve got everything we need. Our team is scoping your first automations now
                  &mdash; expect a kickoff email within one business day.
                </p>
              </motion.div>
            )}

            {step === 'error' && result && !result.ok && (
              <IntakeErrorPanel
                key="error"
                error={result.error}
                onRetry={() => setStep(5)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-1 flex-1 rounded transition-colors ${
            n <= current ? 'bg-accent' : 'bg-dark-border'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-white/40">
        {current} / {total}
      </span>
    </div>
  );
}

function NavRow({
  canAdvance,
  onBack,
  onNext,
  submitLabel,
  advanceHint,
}: {
  canAdvance: boolean;
  onBack?: () => void;
  onNext: () => void;
  submitLabel?: string;
  advanceHint?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-dark-border px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        {advanceHint && <span className="text-xs text-white/40">{advanceHint}</span>}
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="rounded bg-accent px-6 py-2 text-sm font-semibold text-white transition-opacity hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel ?? 'Next'}
        </button>
      </div>
    </div>
  );
}

function IntakeErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  const messages: Record<string, string> = {
    unauthorized: 'Your onboarding link is no longer valid. Ask Raijuu to resend it.',
    'already-submitted': 'This engagement has already been submitted. We\u2019re on it.',
    invalid:
      'Something in the form looked off to our validator. Step back and double-check your entries.',
    server: 'Our side coughed. Try submitting again in a moment.',
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
      <p className="mb-3 text-xl font-semibold">Couldn&apos;t submit that.</p>
      <p className="mx-auto mb-8 max-w-md text-white/60">
        {messages[error] ?? 'Unknown error.'}
      </p>
      {error !== 'already-submitted' && error !== 'unauthorized' && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-accent px-6 py-2 font-semibold text-white transition-opacity hover:bg-accent-light"
        >
          Try again
        </button>
      )}
    </motion.div>
  );
}
