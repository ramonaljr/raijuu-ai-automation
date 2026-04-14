'use client';

import { useState, useTransition } from 'react';
import { claimEngagement, type ClaimResult } from './actions';
import type { EngagementCandidate } from '@/lib/portal/engagement';

export function PickList({ candidates }: { candidates: EngagementCandidate[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pick(id: number) {
    setActiveId(id);
    setError(null);
    startTransition(async () => {
      const result: ClaimResult = await claimEngagement({ engagementId: id });
      if (!result.ok) {
        setError(result.error);
        setActiveId(null);
      }
      // On ok, the server action redirects — nothing to do here.
    });
  }

  return (
    <ul className="space-y-3">
      {candidates.map((c) => {
        const busy = isPending && activeId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => pick(c.id)}
              disabled={isPending}
              className="flex w-full items-center justify-between rounded-xl border border-[color:var(--portal-border)] bg-white px-5 py-4 text-left hover:border-[color:var(--accent)] disabled:opacity-50"
            >
              <span>
                <span className="block text-sm font-semibold text-neutral-900">
                  {c.companyName}
                </span>
                <span className="block text-xs text-neutral-500">
                  Started {c.startedAt.toLocaleDateString()}
                </span>
              </span>
              <span className="text-xs font-medium text-[color:var(--accent)]">
                {busy ? 'Opening…' : 'Open →'}
              </span>
            </button>
          </li>
        );
      })}
      {error && (
        <li className="text-sm text-red-700">
          Something went wrong ({error}). Refresh and try again.
        </li>
      )}
    </ul>
  );
}
