"use client";

interface SectionBadgeProps {
  number: string;
  label: string;
}

export default function SectionBadge({ number, label }: SectionBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm">
      <span className="text-muted">{number}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
      <span className="font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}
