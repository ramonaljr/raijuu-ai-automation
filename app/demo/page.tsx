import { DemoFlow } from './DemoFlow';

export const metadata = {
  title: 'See Raijuu in Action | 60-second Analysis',
  description:
    "Tell us your situation. We'll show you exactly what Raijuu would automate.",
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-dark-bg text-white flex flex-col items-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-gradient-hero">
          See Raijuu in Action
        </h1>
        <p className="mb-10 text-white/60">
          Tell us your situation. In 60 seconds, we&apos;ll show you exactly
          what we&apos;d automate and what it&apos;d be worth.
        </p>
        <DemoFlow />
      </div>
    </main>
  );
}
