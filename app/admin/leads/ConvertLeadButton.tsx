'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';

type Result =
  | { ok: true; engagementId: number; emailSent: boolean; url?: string }
  | { ok: 'conflict'; engagementId: number; status: string }
  | { ok: false; error: string };

export function ConvertLeadButton({
  leadId,
  email,
}: {
  leadId: number;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fee, setFee] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the first input when the panel opens; return focus to the
  // trigger when it closes. Keeps keyboard users oriented.
  useEffect(() => {
    if (open) firstInputRef.current?.focus();
    else triggerRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    setResult(null);
  }

  function submit() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/engagements/create-from-lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            leadId,
            companyName,
            monthlyFeeCents: fee ? Number(fee) * 100 : undefined,
          }),
        });
        const body = await res.json();
        if (res.status === 409 && body.error === 'already-converted') {
          setResult({
            ok: 'conflict',
            engagementId: body.engagementId,
            status: body.status,
          });
          return;
        }
        if (!res.ok && res.status !== 207) {
          setResult({ ok: false, error: body.error ?? `http-${res.status}` });
          return;
        }
        setResult({
          ok: true,
          engagementId: body.engagementId,
          emailSent: body.emailSent,
          url: body.url,
        });
      } catch (e) {
        setResult({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    });
  }

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded="false"
        aria-controls={panelId}
        className="text-xs rounded border px-2 py-1 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        Convert to client
      </button>
    );
  }

  return (
    <div
      id={panelId}
      role="group"
      aria-label={`Convert ${email} to a client engagement`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
      className="rounded border p-2 space-y-2 bg-neutral-50 text-xs min-w-[260px]"
    >
      <p className="text-neutral-600">Converting {email}</p>
      <input
        ref={firstInputRef}
        aria-label="Company name"
        placeholder="Company name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      <input
        aria-label="Monthly fee (USD)"
        placeholder="Monthly fee (USD, optional)"
        inputMode="numeric"
        value={fee}
        onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))}
        className="w-full border rounded px-2 py-1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || companyName.length < 2}
          className="rounded bg-black text-white px-2 py-1 disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Create + send link'}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded border px-2 py-1"
        >
          Cancel
        </button>
      </div>
      {result && result.ok === true && (
        <div className="text-green-700 space-y-1">
          <p>Engagement #{result.engagementId} created.</p>
          <p>
            Email {result.emailSent ? 'sent' : 'NOT sent (check logs)'}.
          </p>
          {result.url && (
            <p className="break-all">
              Link:{' '}
              <a className="underline" href={result.url}>
                {result.url}
              </a>
            </p>
          )}
        </div>
      )}
      {result && result.ok === 'conflict' && (
        <div className="text-amber-700 space-y-1">
          <p>Already converted.</p>
          <p>
            Existing engagement{' '}
            <a
              className="underline"
              href={`/admin/clients/${result.engagementId}`}
            >
              #{result.engagementId}
            </a>{' '}
            ({result.status}).
          </p>
        </div>
      )}
      {result && result.ok === false && (
        <p className="text-red-700">Error: {result.error}</p>
      )}
    </div>
  );
}
