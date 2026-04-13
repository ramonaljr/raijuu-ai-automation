import { describe, it, expect } from 'vitest';
import { demoSubmissionSchema, substituteTemplate } from './submission';

describe('demoSubmissionSchema', () => {
  it('accepts a valid submission', () => {
    const ok = demoSubmissionSchema.parse({
      email: 'a@b.co',
      industry: 'saas',
      situationText: 'We get 40 support tickets a day and my team is drowning.',
    });
    expect(ok.email).toBe('a@b.co');
  });
  it('rejects bad email', () => {
    expect(() =>
      demoSubmissionSchema.parse({
        email: 'not-email',
        industry: 'saas',
        situationText: 'x'.repeat(50),
      }),
    ).toThrow();
  });
  it('rejects unknown industry', () => {
    expect(() =>
      demoSubmissionSchema.parse({
        email: 'a@b.co',
        industry: 'aerospace',
        situationText: 'x'.repeat(50),
      }),
    ).toThrow();
  });
  it('rejects short situation', () => {
    expect(() =>
      demoSubmissionSchema.parse({
        email: 'a@b.co',
        industry: 'saas',
        situationText: 'short',
      }),
    ).toThrow();
  });
});

describe('substituteTemplate', () => {
  it('substitutes situationDetail', () => {
    expect(
      substituteTemplate('You said: {{situationDetail}}.', 'too many leads', 'SaaS'),
    ).toBe('You said: too many leads.');
  });
  it('escapes HTML in situation', () => {
    expect(
      substituteTemplate('Said: {{situationDetail}}', '<script>x</script>', 'SaaS'),
    ).toContain('&lt;script&gt;');
  });
  it('truncates long situations to 120 chars', () => {
    const long = 'x'.repeat(200);
    const result = substituteTemplate('{{situationDetail}}', long, 'SaaS');
    expect(result.length).toBeLessThanOrEqual(120 + 10);
  });
  it('substitutes industry', () => {
    expect(substituteTemplate('{{industry}} teams', 'x'.repeat(50), 'E-commerce')).toBe(
      'E-commerce teams',
    );
  });
});
