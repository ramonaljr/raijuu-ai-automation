import type { ReactNode } from 'react';

/**
 * Soft convention — none required, all opportunistic. n8n workflows that
 * follow it get rendered nicely; arbitrary payloads still render readably.
 *
 *   summary:    string  → headline
 *   highlights: string[] → bulleted list
 *   metrics:    Record<string, string|number|boolean> → key/value grid
 *
 * Anything else falls through to a generic key/value table at the bottom.
 * Nested objects and arrays beyond `highlights` show as compact JSON in the
 * fallback — the always-available raw view covers power users.
 */
const RECOGNIZED_KEYS = new Set(['summary', 'highlights', 'metrics']);

type Outcome = Record<string, unknown>;

function isOutcome(value: unknown): value is Outcome {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

export function OutcomeRenderer({ outcome }: { outcome: unknown }) {
  if (!isOutcome(outcome)) {
    return (
      <EmptyState>
        No outcome payload was recorded for this run.
      </EmptyState>
    );
  }

  const summary = typeof outcome.summary === 'string' ? outcome.summary : null;
  const highlights = Array.isArray(outcome.highlights)
    ? outcome.highlights.filter((h): h is string => typeof h === 'string')
    : [];
  const metrics =
    isOutcome(outcome.metrics) && Object.keys(outcome.metrics).length > 0
      ? outcome.metrics
      : null;
  const otherKeys = Object.keys(outcome).filter(
    (k) => !RECOGNIZED_KEYS.has(k),
  );

  const nothingRecognized =
    !summary && highlights.length === 0 && !metrics;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
          <p className="text-base font-medium leading-relaxed text-neutral-900">
            {summary}
          </p>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            Highlights
          </p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-800">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="select-none text-neutral-400">—</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {metrics && (
        <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            Metrics
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(metrics).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[color:var(--portal-border)] pb-2 last:border-b-0 last:pb-0">
                <dt className="text-xs text-neutral-500">{k}</dt>
                <dd className="font-mono text-sm font-medium text-neutral-900">
                  {formatScalar(v)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {otherKeys.length > 0 && (
        <div className="rounded-xl border border-[color:var(--portal-border)] bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            {nothingRecognized ? 'Details' : 'Additional details'}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            {otherKeys.map((k) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-3 border-b border-[color:var(--portal-border)] pb-2 last:border-b-0 last:pb-0"
              >
                <dt className="text-xs text-neutral-500">{k}</dt>
                <dd className="max-w-[60%] truncate font-mono text-xs text-neutral-800">
                  {formatScalar(outcome[k])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--portal-border)] bg-white p-5 text-sm text-neutral-500">
      {children}
    </div>
  );
}

export function RawOutcomeView({ outcome }: { outcome: unknown }) {
  if (outcome === null || outcome === undefined) return null;
  return (
    <details className="rounded-xl border border-[color:var(--portal-border)] bg-white">
      <summary className="cursor-pointer px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-700">
        View raw payload
      </summary>
      <pre className="overflow-auto border-t border-[color:var(--portal-border)] px-5 py-4 font-mono text-xs leading-relaxed text-neutral-800">
        {JSON.stringify(outcome, null, 2)}
      </pre>
    </details>
  );
}
