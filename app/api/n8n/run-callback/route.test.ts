import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads, automations, runs } from '@/lib/db/schema';
import { POST } from './route';

const SECRET = 'webhook-test-secret';
const ORIGINAL = process.env.N8N_WEBHOOK_SECRET;

async function seed() {
  const [lead] = await db.insert(leads).values({
    email: `n8n-${Date.now()}@raijuu.test`,
    industry: 'test',
    situationText: 'seed',
  }).returning();
  const [eng] = await db.insert(engagements).values({
    leadId: lead.id,
    companyName: 'Webhook Test Co',
  }).returning();
  const [auto] = await db.insert(automations).values({
    engagementId: eng.id,
    name: 'Webhook Test Automation',
  }).returning();
  return { leadId: lead.id, engagementId: eng.id, automationId: auto.id };
}

async function cleanup(ids: { leadId: number; engagementId: number; automationId: number }) {
  await db.delete(runs).where(eq(runs.automationId, ids.automationId));
  await db.delete(automations).where(eq(automations.id, ids.automationId));
  await db.delete(engagements).where(eq(engagements.id, ids.engagementId));
  await db.delete(leads).where(eq(leads.id, ids.leadId));
}

function makeRequest(body: unknown, opts: { auth?: string } = {}) {
  return new Request('http://localhost/api/n8n/run-callback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(opts.auth ? { authorization: opts.auth } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/n8n/run-callback', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    if (ORIGINAL == null) delete process.env.N8N_WEBHOOK_SECRET;
    else process.env.N8N_WEBHOOK_SECRET = ORIGINAL;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('rejects bad bearer with 401', async () => {
    const res = await POST(makeRequest({}, { auth: 'Bearer wrong' }));
    expect(res.status).toBe(401);
  });

  it('rejects malformed body with 400', async () => {
    const res = await POST(
      makeRequest({ status: 'unknown' }, { auth: `Bearer ${SECRET}` }),
    );
    expect(res.status).toBe(400);
  });

  it('inserts a new run and returns idempotent=false', async () => {
    const ids = await seed();
    try {
      const exec = `exec-${Date.now()}`;
      const res = await POST(
        makeRequest(
          {
            n8nExecutionId: exec,
            automationId: ids.automationId,
            startedAt: new Date().toISOString(),
            status: 'success',
            outcome: { time_saved_minutes: 12 },
          },
          { auth: `Bearer ${SECRET}` },
        ),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.idempotent).toBe(false);
      expect(typeof body.runId).toBe('number');
    } finally {
      await cleanup(ids);
    }
  });

  it('returns idempotent=true on duplicate execution id', async () => {
    const ids = await seed();
    try {
      const exec = `exec-dup-${Date.now()}`;
      const payload = {
        n8nExecutionId: exec,
        automationId: ids.automationId,
        startedAt: new Date().toISOString(),
        status: 'success' as const,
      };
      const first = await POST(makeRequest(payload, { auth: `Bearer ${SECRET}` }));
      expect(first.status).toBe(200);
      const second = await POST(makeRequest(payload, { auth: `Bearer ${SECRET}` }));
      expect(second.status).toBe(200);
      const body = await second.json();
      expect(body.idempotent).toBe(true);
    } finally {
      await cleanup(ids);
    }
  });

  it('returns 404 when automation does not exist', async () => {
    const res = await POST(
      makeRequest(
        {
          n8nExecutionId: `missing-${Date.now()}`,
          automationId: 999_999_999,
          startedAt: new Date().toISOString(),
          status: 'success',
        },
        { auth: `Bearer ${SECRET}` },
      ),
    );
    expect(res.status).toBe(404);
  });
});
