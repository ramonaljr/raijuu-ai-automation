/* Raijuu — AI Automation Agency, 3D version — texts and their places on the timeline.
   Everything a non-developer may want to edit lives in this file.

   `at(id, sec)` is a moment: `sec` seconds into the part called `id`. The parts are
   hero · in (the flight to the frame) · ch1 · ch2 · ch3 · out (back into the hall, now in ruins) · finale · return.
   Seconds are seconds of film, so a text that starts at at('ch2', 5.9) appears on the frame 5.9 s into chapter II. */
export function buildContent(at, end) {
  /* ---- Chapters (card, rail, overlay) ---- */
  const CHAPTERS = [
    {
      start: at('ch1', 0.35), end: at('ch2'),
      cardCaption: 'I/III, Architecture, 2026',
      thumb: 'assets/paintings/consummation-thumb.webp',
      overlay: {
        year: 'Phase 01 · Peak Complexity',
        title: 'The Architecture of Scale',
        label: ['AI Agents & Orchestration', 'n8n · OpenAI · Anthropic · CRM Sync', 'Avg. 38 hrs/wk reclaimed (placeholder)'],
        image: 'assets/paintings/consummation.webp',
        alt: 'The Consummation of Empire by Thomas Cole: a marble city around a harbour at noon.',
        text: [
          'Every growing company reaches peak complexity—hundreds of moving parts, brittle handoffs, and teams buried in repetitive ops across HubSpot, Slack, and spreadsheets.',
          'Raijuu designs custom AI lead-qualification agents, automated CRM enrichment, and self-healing data pipelines that cut response times under 60 seconds.',
        ],
      },
    },
    {
      start: at('ch2'), end: at('ch3'),
      cardCaption: 'II/III, Bottleneck, 2026',
      thumb: 'assets/paintings/destruction-thumb.webp',
      overlay: {
        year: 'Phase 02 · Legacy Friction',
        title: 'When Manual Ops Break',
        label: ['Workflow Audit & Refactor', 'Error & Latency Elimination', '3.2x faster ticket resolution (placeholder)'],
        image: 'assets/paintings/destruction.webp',
        alt: 'Destruction by Thomas Cole: the same city burning under a storm.',
        text: [
          'Adding headcount to patch broken workflows only accelerates the storm. Leads slip, support queues overflow, and your best talent burns out on copy-paste work.',
          'We step into the storm—auditing your stack in 48 hours, eliminating single points of failure, and replacing brittle manual loops with deterministic + LLM automation.',
        ],
      },
    },
    {
      start: at('ch3'), end: at('out'),
      cardCaption: 'III/III, Autonomy, 2026',
      thumb: 'assets/paintings/desolation-thumb.webp',
      overlay: {
        year: 'Phase 03 · Autonomous Clarity',
        title: 'Autonomous Clarity',
        label: ['24/7 Agentic Operations', 'Monitored · Observable · Resilient', '99.9% pipeline uptime (placeholder)'],
        image: 'assets/paintings/desolation.webp',
        alt: 'Desolation by Thomas Cole: overgrown ruins under a rising moon.',
        text: [
          'After the noise clears, only what is essential remains. Workflows run silently in the background while your team focuses on strategy, product, and craft.',
          'From autonomous outbound & onboarding to custom internal copilots—we ship production infrastructure in 14 days that compounds while you sleep.',
        ],
      },
    },
  ];

  /* Card is hidden while the camera is between paintings. */
  const CARD_RANGES = [
    [at('ch1', 1.3), at('ch1', 11.8)],
    [at('ch2', 1.3), at('ch2', 8.9)],
    [at('ch3', 5.6), at('ch3', 9.6)],
  ];

  /* Rail is visible from the first painting to the way out. */
  const RAIL_RANGE = [at('ch1', 0.35), at('out', 0.4)];

  /* ---- Scenes (texts over the film) ----
     type 'title'  : small label + big title bottom left, paragraph on the right
     type 'center' : one line in the middle of the screen
     width         : paragraph width in design pixels (1440 grid): 244, the width of the painting card it stands under
     phoneWidth    : its width on a phone (390 grid), where every paragraph sits in the middle of the screen
     <br class="wide"> in a title breaks the line on a computer only */
  const SCENES = [
    {
      id: 'hero', type: 'title', ranges: [[0, at('in', 1.6)], [at('return', 4.84), end + 1]],   // also on at the very end, so the wrap to the top changes nothing
      label: 'Raijuu — AI Automation Agency', title: 'The Architecture<br>of Autonomy',
      body: 'Three stages. One system. From manual chaos to autonomous scale.', width: 244, phoneWidth: 220,
    },
    {
      id: 'ch1', type: 'title', range: [at('ch1', 1.3), at('ch1', 3.8)],
      label: 'Phase 01 — Foundation', title: 'Peak<br>Complexity',
      body: 'Fleets of tools. Endless handoffs. A growing business that looks unstoppable—until the manual work catches up.', width: 244, phoneWidth: 308,
    },
    {
      id: 'conqueror', type: 'title', range: [at('ch1', 4.9), at('ch1', 7.3)],
      label: 'Phase 01 — Orchestration', title: 'The bottleneck',
      body: 'Teams spend half their week routing data between tabs. Nobody is looking at the system as a whole.', width: 244, phoneWidth: 308,
    },
    { id: 'sky', type: 'center', range: [at('ch1', 12.5), at('ch2', 0.5)], text: 'Then the workload spikes.', phoneWidth: 308 },
    {
      id: 'ch2', type: 'title', range: [at('ch2', 1.3), at('ch2', 4.3)],
      label: 'Phase 02 — Collapse', title: 'Legacy<br>Friction',
      body: 'Same team. Same tools. Twice the volume. Brittle spreadsheets crack under the pressure of real-time demand.', width: 244, phoneWidth: 335,
    },
    {
      id: 'statue', type: 'title', range: [at('ch2', 5.9), at('ch2', 8.9)],
      label: 'Phase 02 — Transformation', title: 'The manual<br>burden',
      body: 'Outdated processes still demand human hours for work a well-built agent completes in milliseconds.', width: 244, phoneWidth: 308,
    },
    { id: 'water', type: 'center', range: [at('ch2', 9.9), at('ch3', 3.4)], text: 'And then, quiet precision.', phoneWidth: 162 },
    {
      id: 'ch3', type: 'title', range: [at('ch3', 5.6), at('ch3', 7.3)],
      label: 'Phase 03 — Autonomy', title: 'Autonomous<br>Systems',
      body: 'The busywork is gone. The core remains. Agents and pipelines run without intervention.', width: 244, phoneWidth: 320,
    },
    {
      id: 'column', type: 'title', range: [at('ch3', 7.6), at('ch3', 9.6)],
      label: 'Phase 03 — Compounding', title: 'Built to<br>endure',
      body: 'One unified architecture where ten tools used to be—self-healing, observable, and always on.', width: 244, phoneWidth: 308,
    },
    {
      id: 'finale', type: 'title', range: [at('out', 3.9), at('return', 0.55)],
      label: 'Raijuu — AI Automation Agency', title: 'Every empire outgrows <br class="wide">its manual era.',
      body: 'Book a free 30-minute workflow audit, or scroll on to begin again.', width: 244, phoneWidth: 320,
      bodyRange: [at('out', 3.9), at('finale', 3.1)],   // paragraph gives way to the button
    },
  ];

  /* "Watch again" is offered in the ruined hall. Scrolling on does the same as the button. */
  const AGAIN_RANGE = [at('finale', 3.1), at('return', 0.55)];

  /* How long the button takes to play the return to the first hall, in milliseconds. */
  const AGAIN_MS = 5200;

  /* The scroll hint reads "watch again" from the way out of the last painting until the first hall is back. */
  const HINT_AGAIN_RANGE = [at('out', 3.9), at('return', 4.84)];

  /* The painting may not be touched: where the cursor says so (the two halls at rest). */
  const TOUCH_RANGES = [[0, at('in', 1.2)], [at('out', 4.2), at('return', 0.9)], [at('return', 4.84), end + 1]];

  return { CHAPTERS, CARD_RANGES, RAIL_RANGE, SCENES, AGAIN_RANGE, AGAIN_MS, HINT_AGAIN_RANGE, TOUCH_RANGES };
}
