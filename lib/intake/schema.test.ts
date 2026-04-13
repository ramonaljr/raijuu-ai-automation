import { describe, it, expect } from 'vitest';
import { intakeSubmissionSchema, KNOWN_TOOLS } from './schema';

function validPayload() {
  return {
    companyName: 'Acme Inc',
    role: 'COO',
    tools: ['gmail', 'slack'] as const,
    customTools: 'Retool',
    credentialsVaultUrl: 'https://share.1password.com/abc',
    goals: [
      'Automate weekly revenue digest',
      'Sync HubSpot deals into Slack',
      'Alert on churn risk signals',
    ],
    successMetric: 'Save 10 hours per week across the ops team',
    constraints: 'No data leaves US region',
  };
}

describe('intakeSubmissionSchema', () => {
  it('accepts a valid payload (happy path)', () => {
    const result = intakeSubmissionSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it('defaults optional fields to undefined when omitted', () => {
    const { customTools: _c, credentialsVaultUrl: _u, constraints: _k, ...rest } = validPayload();
    const result = intakeSubmissionSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customTools).toBeUndefined();
      expect(result.data.credentialsVaultUrl).toBeUndefined();
      expect(result.data.constraints).toBeUndefined();
    }
  });

  it('rejects companyName shorter than min or longer than max', () => {
    const short = intakeSubmissionSchema.safeParse({ ...validPayload(), companyName: 'A' });
    expect(short.success).toBe(false);
    const long = intakeSubmissionSchema.safeParse({ ...validPayload(), companyName: 'x'.repeat(121) });
    expect(long.success).toBe(false);
  });

  it('rejects unknown tool IDs', () => {
    const result = intakeSubmissionSchema.safeParse({
      ...validPayload(),
      tools: ['gmail', 'not-a-real-tool'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects goal arrays not of exact length 3', () => {
    const two = intakeSubmissionSchema.safeParse({
      ...validPayload(),
      goals: ['goal one here', 'goal two here'],
    });
    expect(two.success).toBe(false);
    const four = intakeSubmissionSchema.safeParse({
      ...validPayload(),
      goals: ['goal one here', 'goal two here', 'goal three here', 'goal four here'],
    });
    expect(four.success).toBe(false);
  });

  it('rejects a credentialsVaultUrl that is not a URL', () => {
    const result = intakeSubmissionSchema.safeParse({
      ...validPayload(),
      credentialsVaultUrl: 'not a url',
    });
    expect(result.success).toBe(false);
  });

  it('exports all 13 known tools', () => {
    expect(KNOWN_TOOLS).toHaveLength(13);
    expect(KNOWN_TOOLS).toContain('gmail');
    expect(KNOWN_TOOLS).toContain('linear');
  });
});
