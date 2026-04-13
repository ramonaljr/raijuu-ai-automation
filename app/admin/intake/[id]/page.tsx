import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/app/admin/_components/formatters';
import { getIntakeDetail } from '@/lib/admin/intake';

export const dynamic = 'force-dynamic';

type ToolsJson = { tools?: string[]; customTools?: string } | null;

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const detail = await getIntakeDetail(id);
  if (!detail) notFound();

  const { submission, engagement } = detail;
  const tools = submission.toolsJson as ToolsJson;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/intake" className="text-sm underline">
          ← All submissions
        </Link>
      </div>

      <section>
        <h1 className="text-lg font-semibold">Submission #{submission.id}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {engagement?.companyName ?? 'Unknown company'} — submitted{' '}
          {formatDate(submission.submittedAt)}
        </p>
        {engagement && (
          <p className="mt-1 text-sm">
            <Link
              href={`/admin/clients/${engagement.id}`}
              className="underline"
            >
              View client
            </Link>
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Tools</h2>
        <p className="text-sm">
          {tools?.tools?.length ? tools.tools.join(', ') : '—'}
        </p>
        {tools?.customTools && (
          <p className="text-sm text-neutral-600">
            Custom: {tools.customTools}
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Goals</h2>
        <pre className="text-sm whitespace-pre-wrap font-sans">
          {submission.goalsText}
        </pre>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Credentials pointer</h2>
        <p className="text-sm break-all">
          {submission.credentialsVaultRef ?? '— (client did not share a link)'}
        </p>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-medium">Constraints</h2>
        <p className="text-sm whitespace-pre-wrap">
          {submission.constraintsText ?? '—'}
        </p>
      </section>
    </div>
  );
}
