import { z } from 'zod';
import { SUPPORTED_INDUSTRIES } from './content';

export const demoSubmissionSchema = z.object({
  email: z.string().email().max(254),
  industry: z.enum(SUPPORTED_INDUSTRIES),
  situationText: z.string().min(10).max(280),
  turnstileToken: z.string().optional(),
});

export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;

const HTML_ESCAPES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
};

export function substituteTemplate(
  body: string,
  situation: string,
  industryDisplay: string,
): string {
  const safeSituation = situation
    .slice(0, 120)
    .replace(/[<>&"']/g, (c) => HTML_ESCAPES[c]!);
  return body
    .replaceAll('{{situationDetail}}', safeSituation)
    .replaceAll('{{industry}}', industryDisplay);
}
