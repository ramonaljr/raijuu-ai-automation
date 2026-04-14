import { describe, expect, it } from 'vitest';
import { clerkAppearance } from './clerkAppearance';

describe('clerkAppearance', () => {
  it('maps brand tokens to Clerk variables', () => {
    expect(clerkAppearance.variables).toMatchObject({
      colorPrimary: '#4d65ff',
      colorBackground: '#141414',
      colorForeground: '#f9fafb',
      colorInput: '#1f1f1f',
      borderRadius: '0.75rem',
    });
  });

  it('hides the default Clerk header since AuthShell owns the title', () => {
    expect(clerkAppearance.elements?.headerTitle).toContain('hidden');
    expect(clerkAppearance.elements?.headerSubtitle).toContain('hidden');
  });

  it('removes the default card chrome since AuthShell provides framing', () => {
    expect(clerkAppearance.elements?.card).toMatch(/shadow-none|border-0|bg-transparent/);
  });

  it('uses the brand primary on the submit button', () => {
    expect(clerkAppearance.elements?.formButtonPrimary).toContain('bg-[#4d65ff]');
  });

  it('inherits the Geist font stack via CSS variable', () => {
    expect(clerkAppearance.variables?.fontFamily).toBe('var(--font-geist-sans)');
  });

  it('gives interactive elements a visible focus ring on dark bg', () => {
    expect(clerkAppearance.elements?.formButtonPrimary).toContain('focus-visible:ring-2');
    expect(clerkAppearance.elements?.socialButtonsBlockButton).toContain('focus-visible:ring-2');
  });

  it('hides Clerk default footer action to avoid duplicate sign-up link', () => {
    expect(clerkAppearance.elements?.footerAction).toBe('!hidden');
  });
});
