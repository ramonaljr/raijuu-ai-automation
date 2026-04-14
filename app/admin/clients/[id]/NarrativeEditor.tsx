'use client';

import { useState, useTransition } from 'react';
import { saveNarrative } from './actions';

type Status =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

export function NarrativeEditor({
  engagementId,
  month,
  initialValue,
}: {
  engagementId: number;
  month: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [isPending, startTransition] = useTransition();

  const dirty = value !== initialValue;

  function submit() {
    setStatus({ kind: 'idle' });
    startTransition(async () => {
      const result = await saveNarrative({
        engagementId,
        month,
        narrativeMd: value,
      });
      if (result.ok) {
        setStatus({ kind: 'saved' });
      } else {
        setStatus({ kind: 'error', message: result.error });
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500">
        Shown on the client portal /app/reports for {month}. Plain text or
        light markdown — clients see it as prose.
      </p>
      <textarea
        aria-label={`Narrative for ${month}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (status.kind !== 'idle') setStatus({ kind: 'idle' });
        }}
        rows={8}
        maxLength={8000}
        placeholder="What went well this month? What's next?"
        className="w-full rounded border px-3 py-2 text-sm font-mono"
      />
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !dirty}
          className="rounded bg-black text-white px-3 py-1 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save narrative'}
        </button>
        {status.kind === 'saved' && (
          <span className="text-green-700">Saved.</span>
        )}
        {status.kind === 'error' && (
          <span className="text-red-700">Error: {status.message}</span>
        )}
        <span className="ml-auto text-neutral-400">
          {value.length} / 8000
        </span>
      </div>
    </div>
  );
}
