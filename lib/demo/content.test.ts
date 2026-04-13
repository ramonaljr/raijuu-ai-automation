import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { demoContentSchema, SUPPORTED_INDUSTRIES } from './content';

describe('demo content', () => {
  for (const industry of SUPPORTED_INDUSTRIES) {
    it(`${industry}.json matches the schema`, () => {
      const path = join(process.cwd(), 'content/demos', `${industry}.json`);
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      const parsed = demoContentSchema.parse(raw);
      expect(parsed.cards).toHaveLength(3);
      expect(parsed.industry).toBe(industry);
    });
  }
});
