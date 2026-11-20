import { useEffect, useRef, useState } from 'react';

const FAQS = [
  {
    q: 'How fast do we see ROI?',
    a: 'Most clients reclaim 15–40 hours/week within the first 14 days. We prioritize high-frequency bottlenecks—lead routing, ticket triage, and ops reporting—first.',
  },
  {
    q: 'Do we own the workflows, prompts, and code?',
    a: 'Yes, 100%. Everything is deployed into your own n8n, cloud, and repository accounts with full documentation and zero vendor lock-in.',
  },
  {
    q: 'How do you handle data security and privacy?',
    a: 'We sign NDAs upfront, use zero-data-retention enterprise LLM endpoints, and can self-host pipelines inside your private VPC.',
  },
  {
    q: 'What happens when an API or model updates?',
    a: 'Every production pipeline includes automated error alerts, fallback retries, and optional 24/7 monitoring under our Partner retainer.',
  },
];

const BOTTLENECKS = [
  'Lead Qualification & CRM',
  'Support & Ticket Triage',
  'Ops, Invoicing & Docs',
  'Custom Internal Copilot',
];

function WorkflowDiagram({ nodes }: { nodes: [string, string, string] }) {
  return (
    <div className="site__diagram" aria-hidden="true">
      <span className="site__node caps">{nodes[0]}</span>
      <span className="site__wire"><i></i></span>
      <span className="site__node site__node--ai caps">{nodes[1]}</span>
      <span className="site__wire"><i></i></span>
      <span className="site__node caps">{nodes[2]}</span>
    </div>
  );
}

// The page markup of the original hero3d.html, paired with the full Raijuu AI Automation agency website.
// The engine (public/js/hero3d.js) finds the stage/preloader/overlay elements by id and class,
// fills the scene texts in and drives them.
export default function App() {
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteOn, setSiteOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive ROI Calculator state
  const [teamSize, setTeamSize] = useState(12);
  const [manualHours, setManualHours] = useState(6);
  const [hourlyCost, setHourlyCost] = useState(65);

  // Booking form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bottleneck, setBottleneck] = useState(BOTTLENECKS[0]);
  const [notes, setNotes] = useState('');

  const siteRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const hoursReclaimedPerWeek = Math.round(teamSize * manualHours * 0.65);
  const annualHoursSaved = hoursReclaimedPerWeek * 50;
  const annualSavings = annualHoursSaved * hourlyCost;

  const openSite = (scrollToId?: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    const phaseOv = document.getElementById('overlay');
    if (phaseOv && !phaseOv.hidden) {
      document.getElementById('ovClose')?.click();
    }
    setSiteOpen(true);
    document.body.classList.add('is-locked');
    document.getElementById('stage')?.classList.add('is-veiled');
    requestAnimationFrame(() => {
      setSiteOn(true);
      if (siteRef.current) siteRef.current.scrollTop = 0;
      if (scrollToId) {
        setTimeout(() => {
          document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    });
  };

  const closeSite = () => {
    setSiteOn(false);
    document.body.classList.remove('is-locked');
    document.getElementById('stage')?.classList.remove('is-veiled');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      setSiteOpen(false);
      lastFocusRef.current?.focus({ preventScroll: true });
    }, reduced ? 0 : 500);
  };

  useEffect(() => {
    if (!siteOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSite();
    };
    document.addEventListener('keydown', onKeyDown);

    // Scroll-triggered reveal choreography inside #agencySite
    const rootEl = siteRef.current;
    if (!rootEl) return () => document.removeEventListener('keydown', onKeyDown);
    const targets = [...rootEl.querySelectorAll<HTMLElement>('[data-reveal]')];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { root: rootEl, threshold: 0.12 },
    );
    for (const t of targets) observer.observe(t);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
    };
  }, [siteOpen]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const webhook = import.meta.env.VITE_AUDIT_WEBHOOK_URL as string | undefined;
      if (webhook) {
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            company,
            bottleneck,
            notes,
            estimatedAnnualSavings: annualSavings,
            source: 'raijuu-landing',
          }),
        });
        if (!res.ok) throw new Error('Submission failed');
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Could not send request right now. Please email hello@raijuu.ai directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmitError('');
    setName('');
    setEmail('');
    setCompany('');
    setNotes('');
  };

  return (
    <>
      {/* Preloader */}
      <div className="preloader" id="preloader" role="status" aria-live="polite">
        <p className="preloader__top caps">Raijuu — AI Automation</p>
        <div className="preloader__frame" id="preFrame">
          <p className="preloader__title display">Raijuu<br />AI Automation</p>
        </div>
        <div className="preloader__enter" id="preEnter" hidden>
          <button className="btn-frame display" id="enterBtn" type="button">Enter</button>
          <button className="sound caps" type="button" data-sound-toggle aria-pressed="true">
            <span className="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
            <span data-sound-label>Sound [on]</span>
          </button>
        </div>
        <button className="preloader__skip caps" type="button" onClick={() => openSite()}>
          Skip to Agency Website →
        </button>
        <p className="preloader__count caps" id="preCount">000</p>
        <p className="preloader__status caps" id="preStatus">Rising</p>
        <p className="preloader__hint caps" id="preHint" hidden>Best on a large screen. Scroll slowly.</p>
      </div>

      {/* Fixed stage */}
      <main className="stage" id="stage">
        {/* The whole picture is one WebGL canvas: the hall in 3D, then the film it flies into */}
        <canvas className="stage__canvas" id="gl" aria-hidden="true"></canvas>
        <div className="fade fade--top" aria-hidden="true"></div>
        <div className="fade fade--bottom" aria-hidden="true"></div>

        <header className="header">
          <button className="header__about header__cta caps" type="button" onClick={() => openSite()}>
            Agency &amp; Services
          </button>
          <a className="header__logo display" href="#top" id="logo" aria-label="Raijuu AI Automation — back to start">Raijuu<br />AI Automation</a>
          <button className="sound caps" type="button" data-sound-toggle aria-pressed="true">
            <span className="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
            <span data-sound-label>Sound [on]</span>
          </button>
        </header>

        {/* Painting card (top right) */}
        <button className="card" id="card" type="button" aria-label="View the phase brief">
          <span className="card__img"><img id="cardImg" alt="" src="assets/paintings/consummation-thumb.webp" /></span>
          <span className="card__cap" id="cardCap">I/III, Architecture, 2026</span>
        </button>

        {/* Scene texts are rendered here by js/hero3d.js from js/content3d.js */}
        <div className="titles" id="titles"></div>
        <div className="bodies" id="bodies"></div>
        <div className="centers" id="centers"></div>

        {/* Finale: Watch again (controlled by hero3d.js) + Primary Agency CTA */}
        <button className="btn-frame btn-frame--center display finale-replay" id="againBtn" type="button">Watch again</button>
        <button className="btn-frame display btn-book-finale" type="button" onClick={() => openSite('site-book')}>
          Explore Systems &amp; Book Audit
        </button>

        {/* Chapter rail (bottom left) */}
        <nav className="rail" id="rail" aria-label="Chapters">
          <button className="rail__item" type="button" data-chapter="0">
            <span className="rail__line"><i></i></span>
            <span className="rail__row">
              <img className="rail__thumb" alt="" src="assets/paintings/consummation-thumb.webp" />
              <span className="rail__view">Click to view</span>
              <span className="rail__text"><span className="rail__meta">I/III — Scale</span><span className="rail__name">Phase 01<br />Architecture</span></span>
            </span>
          </button>
          <button className="rail__item" type="button" data-chapter="1">
            <span className="rail__line"><i></i></span>
            <span className="rail__row">
              <img className="rail__thumb" alt="" src="assets/paintings/destruction-thumb.webp" />
              <span className="rail__view">Click to view</span>
              <span className="rail__text"><span className="rail__meta">II/III — Friction</span><span className="rail__name">Phase 02<br />Bottleneck</span></span>
            </span>
          </button>
          <button className="rail__item" type="button" data-chapter="2">
            <span className="rail__line"><i></i></span>
            <span className="rail__row">
              <img className="rail__thumb" alt="" src="assets/paintings/desolation-thumb.webp" />
              <span className="rail__view">Click to view</span>
              <span className="rail__text"><span className="rail__meta">III/III — Clarity</span><span className="rail__name">Phase 03<br />Autonomy</span></span>
            </span>
          </button>
        </nav>

        <p className="hint caps" id="hint">Scroll to<br /><span id="hintWord">step inside</span></p>
      </main>

      {/* Original painting / Phase brief overlay */}
      <div className="overlay" id="overlay" role="dialog" aria-modal="true" aria-labelledby="ovTitle" hidden>
        <button className="overlay__close caps" type="button" id="ovClose">Close <span>(Esc)</span></button>
        <div className="overlay__left">
          <p className="overlay__year" id="ovYear"></p>
          <h2 className="overlay__title display" id="ovTitle"></h2>
          <p className="overlay__label" id="ovLabel"></p>
        </div>
        <figure className="overlay__figure"><img id="ovImg" alt="" /></figure>
        <div className="overlay__right" id="ovText"></div>
        <button className="overlay__cta caps" type="button" onClick={() => openSite('site-book')}>
          Explore Agency &amp; Book Audit →
        </button>
        <p className="overlay__note" id="ovNote">Every system we build replaces manual friction with quiet, compounding autonomy.</p>
        <button className="sound sound--overlay caps" type="button" data-sound-toggle aria-pressed="true">
          <span className="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <span data-sound-label>Sound [on]</span>
        </button>
      </div>

      {/* Full Multi-Section Raijuu AI Automation Website */}
      <div
        ref={siteRef}
        className={`site${siteOn ? ' is-on' : ''}`}
        id="agencySite"
        role="dialog"
        aria-modal="true"
        aria-label="Raijuu AI Automation Agency Website"
        hidden={!siteOpen}
      >
        {/* Sticky Website Navbar */}
        <header className="site__nav">
          <button className="site__brand display" type="button" onClick={closeSite}>
            Raijuu AI Automation
          </button>
          <nav className="site__links" aria-label="Agency sections">
            <button type="button" className="caps" onClick={() => jumpTo('site-systems')}>Systems</button>
            <button type="button" className="caps" onClick={() => jumpTo('site-cases')}>Outcomes</button>
            <button type="button" className="caps" onClick={() => jumpTo('site-roi')}>ROI</button>
            <button type="button" className="caps" onClick={() => jumpTo('site-pricing')}>Pricing</button>
            <button type="button" className="caps" onClick={() => jumpTo('site-faq')}>FAQ</button>
          </nav>
          <div className="site__navRight">
            <button type="button" className="site__back caps" onClick={closeSite}>
              ← 3D Hall
            </button>
            <button type="button" className="site__cta caps" onClick={() => jumpTo('site-book')}>
              Book Audit
            </button>
          </div>
        </header>

        {/* 1. Editorial Hero */}
        <section className="site__hero">
          <div className="site__wrap">
            <p className="site__eyebrow caps" data-reveal>Raijuu — AI Automation Agency</p>
            <h1 className="site__h1 display" data-reveal>
              We Replace Manual<br />Operations With<br />Autonomous Systems.
            </h1>
            <p className="site__heroLead" data-reveal>
              We partner with operations-heavy teams to eliminate brittle spreadsheets, slow lead handoffs, and repetitive support work—shipping production AI agents and workflows in 14 days.
            </p>
            <div className="site__heroActions" data-reveal>
              <button type="button" className="btn-frame display" onClick={() => jumpTo('site-book')}>
                Book Free 30-Min Audit
              </button>
              <button type="button" className="site__ghost caps" onClick={() => jumpTo('site-systems')}>
                Explore Core Systems ↓
              </button>
            </div>

            <div className="site__stats" data-reveal>
              <div className="site__stat">
                <span className="site__statNum display">38 hrs/wk</span>
                <span className="site__statCap caps">Avg. team time reclaimed (placeholder)</span>
              </div>
              <div className="site__stat">
                <span className="site__statNum display">&lt; 60s</span>
                <span className="site__statCap caps">Autonomous lead response (placeholder)</span>
              </div>
              <div className="site__stat">
                <span className="site__statNum display">$140k/yr</span>
                <span className="site__statCap caps">Manual-ops cost avoided (placeholder)</span>
              </div>
              <div className="site__stat">
                <span className="site__statNum display">14 Days</span>
                <span className="site__statCap caps">Audit to live production (placeholder)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tech Stack Strip */}
        <section className="site__stackBar">
          <div className="site__wrap site__stackInner">
            <span className="caps site__stackLabel">Production Stack</span>
            <div className="site__stackList">
              {['n8n', 'Make', 'OpenAI', 'Anthropic', 'Gemini', 'HubSpot', 'Salesforce', 'Slack', 'Postgres', 'Supabase'].map((t) => (
                <span key={t} className="site__stackItem caps">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Core Systems & Deliverables (with SVG Workflow Node Diagrams) */}
        <section className="site__section" id="site-systems">
          <div className="site__wrap">
            <div className="site__secHead" data-reveal>
              <p className="site__eyebrow caps">01 — Core Systems &amp; Deliverables</p>
              <h2 className="site__h2 display">Built for Real<br />Operational Leverage</h2>
            </div>
            <div className="site__grid4">
              <article className="site__card" data-reveal>
                <span className="site__cardNum caps">System 01</span>
                <h3 className="site__cardTitle display">AI Lead &amp; CRM Engine</h3>
                <WorkflowDiagram nodes={['Webhook', 'Enrich + Score', 'CRM + Slack']} />
                <p className="site__cardBody">
                  Inbound enrichment, instant qualification, personalized routing, and calendar booking in under 60 seconds—synced directly to HubSpot or Salesforce.
                </p>
                <span className="site__cardMeta caps">HubSpot · Clay · Slack · OpenAI</span>
              </article>
              <article className="site__card" data-reveal>
                <span className="site__cardNum caps">System 02</span>
                <h3 className="site__cardTitle display">Support &amp; Ticket Triage</h3>
                <WorkflowDiagram nodes={['Ticket In', 'RAG + Intent', 'Auto-Resolve']} />
                <p className="site__cardBody">
                  Autonomous L1 resolution, context-aware agent drafts, sentiment detection, and instant SLA escalation across Intercom, Zendesk, and email.
                </p>
                <span className="site__cardMeta caps">Zendesk · Intercom · Anthropic</span>
              </article>
              <article className="site__card" data-reveal>
                <span className="site__cardNum caps">System 03</span>
                <h3 className="site__cardTitle display">Ops &amp; Document Pipelines</h3>
                <WorkflowDiagram nodes={['PDF / Invoice', 'Vision Extract', 'ERP Sync']} />
                <p className="site__cardBody">
                  Automated PDF/invoice extraction, ERP reconciliation, vendor onboarding, and executive KPI digests delivered to Slack every Monday morning.
                </p>
                <span className="site__cardMeta caps">n8n · Postgres · OCR · Stripe</span>
              </article>
              <article className="site__card" data-reveal>
                <span className="site__cardNum caps">System 04</span>
                <h3 className="site__cardTitle display">Custom Internal Copilots</h3>
                <WorkflowDiagram nodes={['Slack Ask', 'Vector Search', 'Action Exec']} />
                <p className="site__cardBody">
                  Private RAG knowledge bases over your Notion, Drive, and SOPs—paired with Slack/Teams action agents that execute real tasks safely.
                </p>
                <span className="site__cardMeta caps">Supabase · Gemini · Slack</span>
              </article>
            </div>
          </div>
        </section>

        {/* 4. Case Studies / Selected Outcomes */}
        <section className="site__section site__section--alt" id="site-cases">
          <div className="site__wrap">
            <div className="site__secHead" data-reveal>
              <p className="site__eyebrow caps">02 — Selected Outcomes (Placeholders)</p>
              <h2 className="site__h2 display">From Bottlenecks<br />to Compounding ROI</h2>
            </div>
            <div className="site__cases">
              <article className="site__caseRow" data-reveal>
                <div className="site__caseMeta">
                  <span className="caps">B2B SaaS · 45-Person Team</span>
                  <strong className="display">4 hrs → 38 sec</strong>
                </div>
                <div className="site__caseBody">
                  <h3>Autonomous Inbound Qualification &amp; Routing</h3>
                  <p>
                    Replaced manual SDR lead research and spreadsheet routing with an n8n + LLM enrichment pipeline. Lead response dropped under 60 seconds and qualified pipeline rose 42% (placeholder).
                  </p>
                </div>
              </article>
              <article className="site__caseRow" data-reveal>
                <div className="site__caseMeta">
                  <span className="caps">Logistics &amp; Ops · Multi-Warehouse</span>
                  <strong className="display">32 hrs/wk Saved</strong>
                </div>
                <div className="site__caseBody">
                  <h3>Zero-Touch Invoice &amp; Manifest Reconciliation</h3>
                  <p>
                    Eliminated manual PDF data entry across 1,200+ monthly shipping manifests with 99.4% extraction accuracy, automated exception alerts, and direct ERP sync (placeholder).
                  </p>
                </div>
              </article>
              <article className="site__caseRow" data-reveal>
                <div className="site__caseMeta">
                  <span className="caps">Digital Agency · 20-Person Team</span>
                  <strong className="display">68% Auto-Resolved</strong>
                </div>
                <div className="site__caseBody">
                  <h3>Client Onboarding &amp; Support Triage Copilot</h3>
                  <p>
                    Built a Slack-integrated AI ops agent that provisions workspaces, summarizes client threads, and drafts L1 responses—saving 18 hours/week for account leads (placeholder).
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 5. Interactive ROI Calculator */}
        <section className="site__section" id="site-roi">
          <div className="site__wrap">
            <div className="site__secHead" data-reveal>
              <p className="site__eyebrow caps">03 — Interactive ROI Estimator</p>
              <h2 className="site__h2 display">Calculate Your<br />Manual-Ops Tax</h2>
            </div>
            <div className="site__roiGrid" data-reveal>
              <div className="site__roiControls">
                <label className="site__slider">
                  <div className="site__sliderTop">
                    <span className="caps">Operations / Team Size</span>
                    <strong className="display">{teamSize} people</strong>
                  </div>
                  <input type="range" min={3} max={100} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} />
                </label>
                <label className="site__slider">
                  <div className="site__sliderTop">
                    <span className="caps">Manual Repetitive Work / Person</span>
                    <strong className="display">{manualHours} hrs/wk</strong>
                  </div>
                  <input type="range" min={2} max={25} value={manualHours} onChange={(e) => setManualHours(Number(e.target.value))} />
                </label>
                <label className="site__slider">
                  <div className="site__sliderTop">
                    <span className="caps">Blended Hourly Cost</span>
                    <strong className="display">${hourlyCost}/hr</strong>
                  </div>
                  <input type="range" min={25} max={150} step={5} value={hourlyCost} onChange={(e) => setHourlyCost(Number(e.target.value))} />
                </label>
              </div>
              <div className="site__roiResult">
                <p className="caps site__muted">Estimated 65% Automation Capture</p>
                <div className="site__roiNums">
                  <div>
                    <span className="site__roiBig display">${annualSavings.toLocaleString()}</span>
                    <span className="caps site__muted">Annual Cost Reclaimed</span>
                  </div>
                  <div>
                    <span className="site__roiBig display">{annualHoursSaved.toLocaleString()} hrs</span>
                    <span className="caps site__muted">Hours Returned / Year</span>
                  </div>
                </div>
                <button type="button" className="btn-frame display" onClick={() => jumpTo('site-book')}>
                  Claim This ROI — Book Audit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. How We Work */}
        <section className="site__section site__section--alt" id="site-process">
          <div className="site__wrap">
            <div className="site__secHead" data-reveal>
              <p className="site__eyebrow caps">04 — How We Work</p>
              <h2 className="site__h2 display">Three Steps to<br />Quiet Precision</h2>
            </div>
            <div className="site__grid3">
              <div className="site__step" data-reveal>
                <span className="site__stepNum display">01</span>
                <h3 className="caps">Workflow Audit · 30 Min</h3>
                <p>We map your current tools, shadow your highest-friction manual loops, and deliver a clear ROI roadmap of your top 3 automation targets.</p>
              </div>
              <div className="site__step" data-reveal>
                <span className="site__stepNum display">02</span>
                <h3 className="caps">Sprint Build · 14 Days</h3>
                <p>We architect, test, and deploy your custom AI agents and n8n/Make pipelines directly into your stack—with full error handling and documentation.</p>
              </div>
              <div className="site__step" data-reveal>
                <span className="site__stepNum display">03</span>
                <h3 className="caps">Autonomous Scale · 24/7</h3>
                <p>Your team reclaims dozens of hours every week while we monitor uptime, tune prompts as models evolve, and ship new workflows on demand.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Engagement Models / Pricing */}
        <section className="site__section" id="site-pricing">
          <div className="site__wrap">
            <div className="site__secHead" data-reveal>
              <p className="site__eyebrow caps">05 — Engagement Models (Placeholders)</p>
              <h2 className="site__h2 display">Simple, Outcome-Driven<br />Partnerships</h2>
            </div>
            <div className="site__grid3">
              <div className="site__tier" data-reveal>
                <span className="caps">01 · Sprint Build</span>
                <h3 className="display">14-Day Sprint</h3>
                <p className="site__tierDesc">Best for teams targeting one high-impact bottleneck first.</p>
                <ul>
                  <li>1 end-to-end production workflow</li>
                  <li>Full CRM / Slack / API integration</li>
                  <li>Error alerting &amp; handover docs</li>
                  <li>100% code &amp; workflow ownership</li>
                </ul>
                <button type="button" className="btn-frame display" onClick={() => jumpTo('site-book')}>
                  Start with Audit
                </button>
              </div>
              <div className="site__tier site__tier--featured" data-reveal>
                <span className="caps">02 · Most Popular</span>
                <h3 className="display">AI Partner</h3>
                <p className="site__tierDesc">Ongoing automation engineering embedded with your ops team.</p>
                <ul>
                  <li>Unlimited workflow roadmap &amp; builds</li>
                  <li>24/7 pipeline monitoring &amp; recovery</li>
                  <li>Prompt &amp; model upgrades included</li>
                  <li>Weekly async &amp; live syncs</li>
                </ul>
                <button type="button" className="btn-frame display" onClick={() => jumpTo('site-book')}>
                  Book Discovery
                </button>
              </div>
              <div className="site__tier" data-reveal>
                <span className="caps">03 · Enterprise</span>
                <h3 className="display">Private VPC</h3>
                <p className="site__tierDesc">For regulated teams needing self-hosted AI infrastructure.</p>
                <ul>
                  <li>Private cloud / VPC deployment</li>
                  <li>Zero-data-retention LLM endpoints</li>
                  <li>Custom RBAC, SSO &amp; audit logs</li>
                  <li>Dedicated SLA &amp; architecture review</li>
                </ul>
                <button type="button" className="btn-frame display" onClick={() => jumpTo('site-book')}>
                  Request Scope
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 7.5. Founder & Human Trust Signals */}
        <section className="site__section site__section--alt" id="site-trust">
          <div className="site__wrap site__founderGrid" data-reveal>
            <div className="site__founderLeft">
              <div className="site__monogram display" aria-hidden="true">RV</div>
              <div>
                <p className="site__eyebrow caps">Founder &amp; Lead Architect</p>
                <h2 className="site__founderName display">Ramon Vallejera Jr</h2>
                <p className="caps site__muted">Raijuu AI Automation</p>
              </div>
            </div>
            <div className="site__founderRight">
              <blockquote className="site__quote">
                &ldquo;Most agencies hand you a fragile prompt and disappear. We engineer production-grade automation—with error recovery, observability, and 100% client ownership—so your operations run quietly while your team ships.&rdquo;
              </blockquote>
              <div className="site__trustPills">
                <span className="caps">✓ Direct Founder-Led Builds</span>
                <span className="caps">✓ NDA-Ready &amp; Zero-Retention LLMs</span>
                <span className="caps">✓ 100% Repo &amp; Workflow Ownership</span>
                <span className="caps">✓ 24/7 Error Alerting Built-In</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ */}
        <section className="site__section" id="site-faq">
          <div className="site__wrap site__faqWrap" data-reveal>
            <div className="site__secHead">
              <p className="site__eyebrow caps">06 — Common Questions</p>
              <h2 className="site__h2 display">Clarity Before<br />We Build</h2>
            </div>
            <div className="agency__faq">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className={`agency__faqItem${isOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="agency__faqQ"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span>{item.q}</span>
                      <span className="agency__faqIcon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && <p className="agency__faqA">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. Dedicated Conversion / Booking Section */}
        <section className="site__section site__section--alt" id="site-book">
          <div className="site__wrap site__bookGrid" data-reveal>
            <div className="site__bookInfo">
              <p className="site__eyebrow caps">07 — Start Here</p>
              <h2 className="site__h2 display">Book Your Free<br />Workflow Audit</h2>
              <p className="site__heroLead">
                Within 24 hours we&apos;ll send calendar times for a focused 30-minute session—and you leave with an actionable automation blueprint either way.
              </p>

              <div className="site__agenda">
                <p className="caps site__muted">30-Min Call Agenda</p>
                <ul>
                  <li><strong>00–10m</strong> — Map your current stack &amp; manual handoffs</li>
                  <li><strong>10–20m</strong> — Identify top 3 highest-ROI automation targets</li>
                  <li><strong>20–30m</strong> — Live architecture &amp; 14-day sprint timeline</li>
                </ul>
              </div>

              <div className="site__bookMeta">
                <p className="caps">Direct Email: <a href="mailto:hello@raijuu.ai">hello@raijuu.ai</a></p>
                <p className="caps">Calendar: <a href="https://cal.com" target="_blank" rel="noreferrer">Schedule directly on Cal.com →</a></p>
                <p className="caps site__muted">NDA-ready · Zero spam · 100% ownership</p>
              </div>
            </div>

            <div className="agency__formWrap">
              {submitted ? (
                <div className="agency__thanks">
                  <p className="agency__eyebrow caps">Audit Request Received</p>
                  <h3 className="agency__thanksTitle display">We will be in touch.</h3>
                  <p className="agency__lead">
                    Thanks, {name}. We&apos;ve logged your workflow audit request for <strong>{bottleneck}</strong> and will send calendar times to <strong>{email}</strong> within 24 hours.
                  </p>
                  <button className="btn-frame display" type="button" onClick={resetForm}>
                    Submit another
                  </button>
                </div>
              ) : (
                <form className="agency__form" onSubmit={handleSubmit}>
                  <p className="agency__subhead caps">Request Free 30-Min Audit</p>
                  <div className="agency__field">
                    <span className="caps">Select Biggest Bottleneck</span>
                    <div className="site__pills">
                      {BOTTLENECKS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`site__pill caps${bottleneck === item ? ' is-active' : ''}`}
                          onClick={() => setBottleneck(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="agency__field">
                    <span className="caps">Your Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="agency__field">
                    <span className="caps">Work Email *</span>
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="agency__field">
                    <span className="caps">Company</span>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </label>
                  <label className="agency__field">
                    <span className="caps">Workflow Notes (Optional)</span>
                    <textarea
                      rows={3}
                      placeholder="Tools you use today and what is slowing the team down..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  {submitError && <p className="agency__error">{submitError}</p>}
                  <div className="agency__actions">
                    <button className="btn-frame display agency__submit" type="submit" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Request Audit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 10. Footer */}
        <footer className="site__footer">
          <div className="site__wrap site__footerInner">
            <span className="display site__footerBrand">Raijuu AI Automation</span>
            <span className="caps site__muted">© 2026 Raijuu · Autonomous Systems Agency</span>
            <button type="button" className="caps site__back" onClick={closeSite}>
              Return to 3D Experience ↑
            </button>
          </div>
        </footer>
      </div>

      {/* Cursor (shown for a mouse only). Over the painting in the hall it turns into the museum's notice. */}
      <div className="cursor" id="cursor" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <circle className="cursor__ring" cx="8" cy="8" r="7.75" stroke="#FBF8EE" strokeOpacity="0.25" strokeWidth="0.5" />
          <circle className="cursor__dot" cx="8" cy="8" r="2" fill="#FBF8EE" />
        </svg>
        <span className="cursor__touch"><img src="assets/ui/cursor-cross.svg" width={8.70711} height={8.70711} alt="" /><span>Please do not touch!</span></span>
      </div>

      {/* Scroll length */}
      <div className="scroll" id="top" aria-hidden="true"></div>

      <div className="no-gl caps" id="noGl"><p>This page needs WebGL 2.<br />Open it in a current browser.</p></div>
    </>
  );
}
