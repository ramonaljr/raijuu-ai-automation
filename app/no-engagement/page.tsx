export default function NoEngagementPage() {
  return (
    <div className="rounded-2xl border border-[color:var(--portal-border)] bg-white p-10 text-center shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--accent)]">
        One more step
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We don&apos;t have an engagement tied to this email yet.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">
        Either your onboarding link hasn&apos;t been used yet, or there&apos;s
        more than one record that needs manual review. Either way — email us
        and we&apos;ll sort it in a few minutes.
      </p>
      <div className="mt-6">
        <a
          href="mailto:ramonvallejerajr@gmail.com"
          className="inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-neutral-800"
        >
          Email Raijuu
        </a>
      </div>
    </div>
  );
}
