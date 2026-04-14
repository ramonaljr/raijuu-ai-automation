'use client';

import { useState, useTransition } from 'react';
import { recomputeCurrentMonth, type RecomputeResult } from './actions';

export function RecomputeButton({ engagementId }: { engagementId: number }) {
  const [result, setResult] = useState<RecomputeResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setResult(null);
    startTransition(async () => {
      const r = await recomputeCurrentMonth({ engagementId });
      setResult(r);
    });
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="rounded border px-3 py-1 hover:bg-neutral-50 disabled:opacity-50"
      >
        {isPending ? 'Recomputing…' : 'Re-aggregate this month'}
      </button>
      {result?.ok === true && (
        <span className="text-green-700">Recomputed {result.month}.</span>
      )}
      {result?.ok === false && (
        <span className="text-red-700">Error: {result.error}</span>
      )}
    </div>
  );
}
