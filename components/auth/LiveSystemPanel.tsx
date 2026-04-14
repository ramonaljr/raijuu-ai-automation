const RUNS = [
  { client: 'acme-corp', flow: 'invoice-sync', ms: '2.3s' },
  { client: 'contoso', flow: 'lead-routing', ms: '1.1s' },
  { client: 'northwind', flow: 'digest-email', ms: '4.7s' },
  { client: 'initech', flow: 'crm-enrich', ms: '0.9s' },
  { client: 'stark-ind', flow: 'support-triage', ms: '3.4s' },
  { client: 'wayne-ent', flow: 'report-rollup', ms: '5.8s' },
  { client: 'umbrella', flow: 'slack-digest', ms: '1.7s' },
  { client: 'tyrell', flow: 'onboard-email', ms: '2.0s' },
];

export default function LiveSystemPanel() {
  // Duplicate so the linear marquee loops without a visible seam.
  const rows = [...RUNS, ...RUNS];

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-12 hero-mask">
      <div className="relative z-10">
        <div className="font-mono text-xs uppercase tracking-widest text-[#6b7280]">
          Raijuu AI Automation
        </div>
        <div className="mt-4 text-5xl font-semibold leading-tight text-white">
          Raijuu
        </div>
        <p className="mt-3 max-w-sm text-lg text-[#9ca3af]">
          Automation that runs itself.
        </p>
      </div>

      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative z-10 w-full" aria-hidden="true">
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-[#6b7280]">
          Live runs
        </div>
        <div className="flex w-[200%] animate-ticker gap-6 font-mono text-sm">
          {rows.map((r, i) => (
            <div
              key={i}
              data-testid="ticker-row"
              className="flex shrink-0 items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#141414]/60 px-4 py-2 text-[#d1d5db]"
            >
              <span className="text-[#4d65ff]">▸</span>
              <span>{r.client}</span>
              <span className="text-[#6b7280]">·</span>
              <span>{r.flow}</span>
              <span className="text-[#6b7280]">·</span>
              <span>{r.ms}</span>
              <span className="text-emerald-400">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
