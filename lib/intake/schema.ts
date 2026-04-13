import { z } from 'zod';

export const KNOWN_TOOLS = [
  'gmail',
  'slack',
  'hubspot',
  'google-sheets',
  'airtable',
  'notion',
  'zapier',
  'stripe',
  'shopify',
  'intercom',
  'zendesk',
  'calendly',
  'linear',
] as const;

export const intakeSubmissionSchema = z.object({
  companyName: z.string().min(2).max(120),
  role: z.string().min(2).max(60),
  tools: z.array(z.enum(KNOWN_TOOLS)).min(1),
  customTools: z.string().max(200).optional(),
  credentialsVaultUrl: z.string().url().max(500).optional(),
  goals: z.array(z.string().min(5).max(200)).length(3),
  successMetric: z.string().min(10).max(300),
  constraints: z.string().max(500).optional(),
});

export type IntakeSubmission = z.infer<typeof intakeSubmissionSchema>;
