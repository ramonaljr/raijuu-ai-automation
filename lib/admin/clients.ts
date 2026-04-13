import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  engagements,
  leads,
  intakeSubmissions,
} from '@/lib/db/schema';

export async function listEngagementsWithLead() {
  return db
    .select({
      id: engagements.id,
      companyName: engagements.companyName,
      status: engagements.status,
      startedAt: engagements.startedAt,
      monthlyFeeCents: engagements.monthlyFeeCents,
      leadEmail: leads.email,
      leadIndustry: leads.industry,
    })
    .from(engagements)
    .leftJoin(leads, eq(engagements.leadId, leads.id))
    .orderBy(desc(engagements.startedAt))
    .limit(200);
}

export async function getEngagementDetail(id: number) {
  const [engagement] = await db
    .select()
    .from(engagements)
    .where(eq(engagements.id, id))
    .limit(1);
  if (!engagement) return null;

  const lead = engagement.leadId
    ? (await db.select().from(leads).where(eq(leads.id, engagement.leadId)).limit(1))[0] ?? null
    : null;

  const [intake] = await db
    .select()
    .from(intakeSubmissions)
    .where(eq(intakeSubmissions.engagementId, id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(1);

  return { engagement, lead, intake: intake ?? null };
}
