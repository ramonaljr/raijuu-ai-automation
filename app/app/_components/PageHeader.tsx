'use client';

import { TextReveal } from '@/components/shared/motion';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  reveal = false,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  reveal?: boolean;
}) {
  return (
    <header className="space-y-2">
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          {eyebrow}
        </p>
      )}
      {reveal ? (
        <TextReveal as="h1" className="text-4xl font-semibold tracking-tight">
          {title}
        </TextReveal>
      ) : (
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      )}
      {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
    </header>
  );
}
