# Raijuu AI Automation — Marketing Landing Page Design

## Decisions

| Decision | Choice |
|---|---|
| Approach | Pixel-perfect clone of Conicorn template + Raijuu branding |
| Stack | Next.js 15 (App Router) + Tailwind CSS v4 |
| Hero 3D | React Three Fiber + @react-three/drei |
| Animations | Framer Motion (scroll-triggered entrances) |
| Architecture | Single-page monolith with lazy-loaded heavy components |
| Branding | Placeholder — user will provide assets later |
| Deploy target | Railway |

## Site Structure

12 sections on a single page with smooth scroll navigation:

1. **Hero** — 3D animated blob/toroid, gradient headline, 2 CTAs, logo carousel
2. **About (001)** — "Who We Are", description, stats ticker, video thumbnail
3. **Values (002)** — "Why Choose Us?", 3 value cards with icons
4. **Services (003)** — "Our AI-Driven Services", 5 service cards, data security panel, session CTA
5. **Process (004)** — "How We Work", 5-step zigzag timeline with icons
6. **Projects (005)** — "What We've Built", 3 case study carousel with metrics
7. **Integrations (006)** — "Technology Ecosystem", 30 integration logos in 3 scrolling rows
8. **Testimonials (007)** — "What They're Saying", testimonial grid + video cards
9. **Pricing (008)** — 2 tiers with monthly/annual toggle
10. **Team (009)** — 5-member carousel with social links
11. **FAQs (010)** — 5-item accordion
12. **Footer** — CTA headline, contact form, social links, nav

## Visual Design

- **Hero:** Dark background with 3D metallic toroid, gradient text (yellow/pink/purple/blue)
- **Body sections:** Light/white background, clean typography
- **Footer:** Dark gradient background with contact form
- **Cards:** Rounded corners, subtle borders, dark dot-grid pattern backgrounds for value cards
- **Section badges:** Numbered labels ("001 * WHO WE ARE") in pill shape
- **Animations:** Scroll-triggered fade-in/slide-up entrances, text reveal animations, logo marquees

## Component Architecture

- Section data in `lib/constants.ts` for easy content swapping
- R3F canvas in isolated `components/three/HeroBlob.tsx`, dynamically imported
- Reusable UI: Button, SectionBadge, Card, Carousel
- Framer Motion variants centralized in `lib/animations.ts`

## Branding (Placeholder)

- Company: Raijuu AI Automation
- Colors: TBD (using neutral dark/light palette until provided)
- Logo: TBD (text-based placeholder)
- Fonts: TBD (using Inter/system font until provided)
