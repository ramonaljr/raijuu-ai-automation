# Raijuu agency and 3D cinema

Vite / React / TypeScript landing page deployed on Railway with this directory as the service root.

```sh
npm ci --include=dev
npm run dev
npm run build
npm run lint
```

The original cinema intro is the default arrival, including its loading choreography and Enter button. Its engine starts after React mounts the stage. The redesigned agency is accessible through the skip link and Agency & Services. Opening the agency preserves the cinema position and pauses its rendering and sound. Its last rendered canvas stays beneath the agency as an inert atmospheric backdrop; cinema controls and captions are hidden. Agency typography, frames, and colors share the cinema’s Cormorant/Geist, warm-black, ivory, and antique-gold system. The cinema uses the existing public assets and vendored Three.js modules.

## Contact requests

Without `VITE_AUDIT_WEBHOOK_URL`, visitors get direct email contact instead of a nonfunctional form. To enable the form, set that build-time variable to an HTTPS endpoint which accepts JSON and allows requests from the site origin. Rebuild after changing it. A successful HTTP response is treated as accepted delivery; the endpoint must reliably persist or deliver the request before returning success.

Payload fields: `name`, `email`, `company`, `notes`, `bottleneck`, `estimatedAnnualSavings`, `source`, and the empty `website` honeypot. The calculator amount is an illustrative estimate, not an actual client result. The endpoint should validate requests and apply spam/rate controls. Never put a credential in a `VITE_` variable: those values are included in the public client bundle.

## Motion and QA

Agency content uses bidirectional scroll entrances/exits, image-led chapter layouts, animated SVG workflow studies, and slow ambient light backgrounds. The original cinema intro remains the first experience on every visit. Background motion pauses offscreen and when the tab is hidden. Reduced-motion preferences disable the agency animations. Content remains visible if the animation effect does not initialize.

Before releasing, check desktop, tablet, and narrow-phone layouts; mobile menu and Escape handling; application filters; FAQ expansion; calculator updates; contact fallback; cinema loading, Enter, scrolling through chapters, and returning to the agency. When the form is configured, verify success and failure with the endpoint owner before sending test enquiries.

`npm run build` may report that the two public CSS links will resolve at runtime. Their files are copied to `dist/css` by Vite; this is expected for the retained cinema stylesheet setup.

## Portfolio and portrait provenance

The 11 case studies in `src/case-studies.ts` and their workflow screenshots in `public/assets/portfolio` were adapted with the owner's permission from the sibling `Ramon's AI Automation Portfolio` project. The source marks all 11 as working demonstration builds for fictional clients. Cards and detail dialogs retain that distinction; outcome figures describe documented workflow behavior or tests rather than client ROI. Case-study source links point to the original public repositories.

The founder portrait in `public/assets/portraits/ramon-roman-general.jpg` is a Roman-inspired oil illustration generated from the owner's supplied portfolio photo, with his requested bronze armor and cloak. The original photo and discarded generated variants are not included in this website.

## Cinematic service and delivery chapters

`src/CinematicSections.tsx` contains the systems gallery, delivery journey, and engagement entrances. The gallery changes paintings and service details with keyboard-accessible buttons and adds a small mouse-controlled perspective tilt. The delivery scene stays in view on desktop while the three explanations change its artwork; phones receive an image with each step. Engagement entrances link to the existing contact section. All three reuse the original cinema artwork, pause ambient animation offscreen, and honor reduced-motion preferences.
