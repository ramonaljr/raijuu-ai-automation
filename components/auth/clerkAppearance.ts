export const clerkAppearance = {
  variables: {
    colorPrimary: '#4d65ff',
    colorBackground: '#141414',
    colorForeground: '#f9fafb',
    colorMutedForeground: '#6b7280',
    colorInput: '#1f1f1f',
    colorInputForeground: '#f9fafb',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-geist-sans)',
  },
  elements: {
    card: 'bg-transparent shadow-none border-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'bg-[#1f1f1f] border border-[#2a2a2a] hover:bg-[#262626] text-[#f9fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d65ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]',
    formButtonPrimary:
      'bg-[#4d65ff] hover:bg-[#6b7fff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d65ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]',
    footerActionLink:
      'text-accent-light hover:text-[#93c5fd] focus-visible:outline-none focus-visible:underline',
    footerAction: 'hidden',
  },
} as const;
