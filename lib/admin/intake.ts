import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { intakeSubmissions, engagements } from '@/lib/db/schema';

export async function listIntakeSubmissions() {
  return db
    .select({
      id: intakeSubmissions.id,
      engagementId: intakeSubmissions.engagementId,
      submittedAt: intakeSubmissions.submittedAt,
      companyName: engagements.companyName,
      engagementStatus: engagements.status,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .orderBy(desc(intakeSubmissions.submittedAt))
    .limit(200);
}

export async function getIntakeDetail(id: number) {
  const [row] = await db
    .select({
      submission: intakeSubmissions,
      engagement: engagements,
    })
    .from(intakeSubmissions)
    .leftJoin(engagements, eq(intakeSubmissions.engagementId, engagements.id))
    .where(eq(intakeSubmissions.id, id))
    .limit(1);
  return row ?? null;
}
