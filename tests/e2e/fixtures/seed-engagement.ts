import { db } from '@/lib/db';
import { engagements, leads, intakeSubmissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function seedTestEngagement(): Promise<{
  engagementId: number;
  token: string;
  leadId: number;
}> {
  const [lead] = await db
    .insert(leads)
    .values({
      email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@raijuu.test`,
      industry: 'saas',
      situationText: 'e2e test seed row \u2014 automated, safe to delete',
    })
    .returning();
  const [eng] = await db
    .insert(engagements)
    .values({
      leadId: lead.id,
      companyName: 'E2E Test Co',
    })
    .returning();
  return { engagementId: eng.id, token: eng.magicLinkToken, leadId: lead.id };
}

export async function cleanupTestEngagement(
  engagementId: number,
  leadId: number,
): Promise<void> {
  // Delete children first due to ON DELETE RESTRICT
  await db
    .delete(intakeSubmissions)
    .where(eq(intakeSubmissions.engagementId, engagementId));
  await db.delete(engagements).where(eq(engagements.id, engagementId));
  await db.delete(leads).where(eq(leads.id, leadId));
}
