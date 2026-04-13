import { z } from 'zod';

export const demoCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  metric: z.string().min(1),
});

export const demoContentSchema = z.object({
  industry: z.string(),
  displayName: z.string(),
  cards: z.array(demoCardSchema).length(3),
  ctaLine: z.string(),
});

export type DemoContent = z.infer<typeof demoContentSchema>;
export type DemoCard = z.infer<typeof demoCardSchema>;

export const SUPPORTED_INDUSTRIES = [
  'general',
  'real-estate',
  'ecommerce',
  'saas',
  'agency',
  'healthcare',
  'professional-services',
] as const;

export type Industry = (typeof SUPPORTED_INDUSTRIES)[number];
