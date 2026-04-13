import { describe, it, expect } from 'vitest';
import * as schema from './schema';

describe('schema', () => {
  it('exports all six tables from the design', () => {
    expect(schema.leads).toBeDefined();
    expect(schema.engagements).toBeDefined();
    expect(schema.intakeSubmissions).toBeDefined();
    expect(schema.automations).toBeDefined();
    expect(schema.runs).toBeDefined();
    expect(schema.outcomesMonthly).toBeDefined();
  });
});
