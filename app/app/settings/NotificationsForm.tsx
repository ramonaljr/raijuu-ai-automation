'use client';

import { useState, useTransition } from 'react';
import { updatePreferences } from './actions';
import type { Preferences } from './preferences';

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: number }
  | { kind: 'error'; message: string };

export function NotificationsForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [isPending, startTransition] = useTransition();

  function save(next: Preferences) {
    setPrefs(next);
    setSaveState({ kind: 'saving' });
    startTransition(async () => {
      const result = await updatePreferences(next);
      if (result.ok) {
        setSaveState({ kind: 'saved', at: Date.now() });
      } else {
        setSaveState({ kind: 'error', message: result.error });
        setPrefs(initial);
      }
    });
  }

  return (
    <div className="space-y-1">
      <ToggleRow
        label="Email me when a run fails"
        description="You'll hear from us the moment an automation errors — no need to watch the portal."
        checked={prefs.notifyOnFailure}
        disabled={isPending}
        onChange={(v) => save({ ...prefs, notifyOnFailure: v })}
      />
      <ToggleRow
        label="Weekly digest email"
        description="A Monday summary of what ran, what saved you time, and what's next."
        checked={prefs.notifyOnDigest}
        disabled={isPending}
        onChange={(v) => save({ ...prefs, notifyOnDigest: v })}
      />
      <SaveIndicator state={saveState} />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 border-b border-[color:var(--portal-border)] py-4 last:border-b-0">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
      <span
        className={[
          'relative mt-1 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-[color:var(--accent)]' : 'bg-neutral-300',
          disabled ? 'opacity-50' : '',
        ].join(' ')}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </label>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state.kind === 'idle') return null;
  const text =
    state.kind === 'saving'
      ? 'Saving…'
      : state.kind === 'saved'
        ? 'Saved'
        : `Couldn't save: ${state.message}`;
  const tone =
    state.kind === 'error' ? 'text-red-600' : 'text-neutral-500';
  return (
    <p className={`pt-3 text-xs ${tone}`} aria-live="polite">
      {text}
    </p>
  );
}
