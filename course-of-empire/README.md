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
