import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { engagements, leads } from '@/lib/db/schema';
import { getEngagementForUser } from './engagement';

async function seedLead(email: string) {
  const [lead] = await db
    .insert(leads)
    .values({
      email,
      industry: 'test',
      situationText: 'test seed',
    })
    .returning();
  return lead;
}

async function seedEngagement(leadId: number, opts: { clerkUserId?: string } = {}) {
  const [eng] = await db
    .insert(engagements)
    .values({
      leadId,
      companyName: `Test Co ${Date.now()}`,
      clerkUserId: opts.clerkUserId,
    })
    .returning();
  return eng;
}

async function cleanup(emails: string[]) {
  for (const email of emails) {
    const matchingLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.email, email));
    for (const lead of matchingLeads) {
      await db.delete(engagements).where(eq(engagements.leadId, lead.id));
      await db.delete(leads).where(eq(leads.id, lead.id));
    }
  }
}

describe('getEngagementForUser', () => {
  const stamp = Date.now();
  const noMatchEmail = `no-match-${stamp}@raijuu.test`;
  const oneMatchEmail = `one-match-${stamp}@raijuu.test`;
  const claimedEmail = `claimed-${stamp}@raijuu.test`;
  const multiEmail = `multi-${stamp}@raijuu.test`;
  const allEmails = [noMatchEmail, oneMatchEmail, claimedEmail, multiEmail];

  beforeEach(async () => {
    await cleanup(allEmails);
  });

  it('returns no-match when no engagement exists for the email', async () => {
    const result = await getEngagementForUser(`user_${stamp}_a`, noMatchEmail);
    expect(result.kind).toBe('no-match');
  });

  it('claims a single matching unclaimed engagement', async () => {
    const lead = await seedLead(oneMatchEmail);
    await seedEngagement(lead.id);

    const userId = `user_${stamp}_b`;
    const result = await getEngagementForUser(userId, oneMatchEmail);
    expect(result.kind).toBe('claimed');
    if (result.kind === 'claimed') {
      expect(result.engagement.clerkUserId).toBe(userId);
    }

    // Subsequent call returns already-claimed
    const second = await getEngagementForUser(userId, oneMatchEmail);
    expect(second.kind).toBe('already-claimed');
  });

  it('returns already-claimed when the user already owns an engagement', async () => {
    const userId = `user_${stamp}_c`;
    const lead = await seedLead(claimedEmail);
    await seedEngagement(lead.id, { clerkUserId: userId });

    const result = await getEngagementForUser(userId, claimedEmail);
    expect(result.kind).toBe('already-claimed');
  });

  it('returns multiple-matches when more than one unclaimed engagement matches', async () => {
    const lead = await seedLead(multiEmail);
    await seedEngagement(lead.id);
    await seedEngagement(lead.id);

    const result = await getEngagementForUser(`user_${stamp}_d`, multiEmail);
    expect(result.kind).toBe('multiple-matches');
  });
});
