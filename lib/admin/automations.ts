import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { automations, engagements } from '@/lib/db/schema';

export async function listAutomationsWithCompany() {
  return db
    .select({
      id: automations.id,
      name: automations.name,
      description: automations.description,
      status: automations.status,
      n8nWorkflowId: automations.n8nWorkflowId,
      createdAt: automations.createdAt,
      companyName: engagements.companyName,
      engagementId: automations.engagementId,
    })
    .from(automations)
    .leftJoin(engagements, eq(automations.engagementId, engagements.id))
    .orderBy(desc(automations.createdAt))
    .limit(200);
}
