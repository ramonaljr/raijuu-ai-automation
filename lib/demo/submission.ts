import { z } from 'zod';
import { SUPPORTED_INDUSTRIES } from './content';

export const demoSubmissionSchema = z.object({
  email: z.string().email().max(254),
  industry: z.enum(SUPPORTED_INDUSTRIES),
  situationText: z.string().min(10).max(280),
  turnstileToken: z.string().optional(),
});

export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;

/**
 * Substitute {{situationDetail}} and {{industry}} in a template. Returns a
 * plain string intended to be rendered as React text (no dangerouslySetInnerHTML).
 * React escapes text nodes on its own, so we don't HTML-encode here.
 *
 * We still defensively clip length and strip control characters to prevent
 * weird rendering from pasted input.
 */
export function substituteTemplate(
  body: string,
  situation: string,
  industryDisplay: string,
): string {
  const safeSituation = situation
    .slice(0, 120)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '');
  return body
    .replaceAll('{{situationDetail}}', safeSituation)
    .replaceAll('{{industry}}', industryDisplay);
}
