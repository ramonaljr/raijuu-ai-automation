/**
 * Build a deep-link to an n8n workflow if N8N_BASE_URL is configured.
 * n8n's workflow URLs are always `<base>/workflow/<id>`.
 */
export function buildN8nWorkflowUrl(workflowId: string | null): string | null {
  if (!workflowId) return null;
  const base = process.env.N8N_BASE_URL;
  if (!base) return null;
  const trimmed = base.replace(/\/$/, '');
  return `${trimmed}/workflow/${encodeURIComponent(workflowId)}`;
}
