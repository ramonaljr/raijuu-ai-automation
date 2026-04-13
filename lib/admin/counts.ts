import { count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  leads,
  engagements,
  automations,
  intakeSubmissions,
} from '@/lib/db/schema';

export type OverviewCounts = {
  leads: number;
  engagements: number;
  automations: number;
  intakeSubmissions: number;
};

export async function getOverviewCounts(): Promise<OverviewCounts> {
  const [l, e, a, i] = await Promise.all([
    db.select({ value: count() }).from(leads),
    db.select({ value: count() }).from(engagements),
    db.select({ value: count() }).from(automations),
    db.select({ value: count() }).from(intakeSubmissions),
  ]);
  return {
    leads: l[0]?.value ?? 0,
    engagements: e[0]?.value ?? 0,
    automations: a[0]?.value ?? 0,
    intakeSubmissions: i[0]?.value ?? 0,
  };
}
