import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';

export async function listLeads() {
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
}
