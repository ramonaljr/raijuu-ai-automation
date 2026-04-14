'use client';

import { useState, useTransition } from 'react';
import { resolveDeadLetter, retryDeadLetter, type Result } from './actions';

export function RowActions({ id }: { id: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handle(kind: 'resolve' | 'retry') {
    setMsg(null);
    startTransition(async () => {
      const r: Result =
        kind === 'resolve'
          ? await resolveDeadLetter({ id })
          : await retryDeadLetter({ id });
      setMsg(r.ok ? 'Done.' : `Error: ${r.error}`);
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => handle('retry')}
        disabled={isPending}
        className="rounded border px-2 py-0.5 hover:bg-neutral-50 disabled:opacity-50"
      >
        Retry
      </button>
      <button
        type="button"
        onClick={() => handle('resolve')}
        disabled={isPending}
        className="rounded border px-2 py-0.5 hover:bg-neutral-50 disabled:opacity-50"
      >
        Resolve
      </button>
      {msg && <span className="text-neutral-500">{msg}</span>}
    </div>
  );
}
