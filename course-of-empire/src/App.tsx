import { useEffect, useRef, useState } from 'react';

// The page markup of the original hero3d.html, with Raijuu agency conversion overlays.
// The engine (public/js/hero3d.js) finds the stage/preloader/overlay elements by id and class,
// fills the scene texts in and drives them.
export default function App() {
  const [agencyOpen, setAgencyOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bottleneck, setBottleneck] = useState('Lead Qualification & CRM');
  const [notes, setNotes] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  const openAgency = () => {
    // Close the phase overlay if it is currently open
    const phaseOv = document.getElementById('overlay');
    if (phaseOv && !phaseOv.hidden) {
      document.getElementById('ovClose')?.click();
    }
    setAgencyOpen(true);
    document.body.classList.add('is-locked');
    document.getElementById('stage')?.classList.add('is-veiled');
  };

  const closeAgency = () => {
    setAgencyOpen(false);
    document.body.classList.remove('is-locked');
    document.getElementById('stage')?.classList.remove('is-veiled');
  };

  useEffect(() => {
    if (!agencyOpen) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAgency();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [agencyOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
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
          <div className="header__left">
            <button className="header__about header__cta caps" type="button" onClick={openAgency}>
              Services &amp; Proof
            </button>
            <button className="header__about header__cta caps" type="button" onClick={openAgency}>
              Book Audit
            </button>
          </div>
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

        <button className="btn-frame btn-frame--center display" id="againBtn" type="button">Watch again</button>
        <button className="btn-book-finale caps" type="button" onClick={openAgency}>
          Or book your free 30-min workflow audit →
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
        <button className="overlay__cta caps" type="button" onClick={openAgency}>
          Book Free Workflow Audit →
        </button>
        <p className="overlay__note" id="ovNote">Every system we build replaces manual friction with quiet, compounding autonomy.</p>
        <button className="sound sound--overlay caps" type="button" data-sound-toggle aria-pressed="true">
          <span className="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <span data-sound-label>Sound [on]</span>
        </button>
      </div>

      {/* Agency & Workflow Audit Booking Overlay */}
      <div
        className={`overlay agency${agencyOpen ? ' is-on' : ''}`}
        id="agencyOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agTitle"
        hidden={!agencyOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeAgency();
        }}
      >
        <button ref={closeRef} className="overlay__close caps" type="button" onClick={closeAgency}>
          Close <span>(Esc)</span>
        </button>

        <div className="agency__grid">
          <section className="agency__info">
            <p className="agency__eyebrow caps">Raijuu — AI Automation Agency</p>
            <h2 className="agency__title display" id="agTitle">Book Your<br />Workflow Audit</h2>
            <p className="agency__lead">
              We partner with operations-heavy teams to replace brittle manual loops with resilient AI agents and end-to-end pipelines.
            </p>

            <div className="agency__metrics">
              <div className="agency__metric">
                <span className="agency__num display">38 hrs/wk</span>
                <span className="agency__cap caps">Reclaimed for B2B SaaS ops (placeholder)</span>
              </div>
              <div className="agency__metric">
                <span className="agency__num display">&lt; 60s</span>
                <span className="agency__cap caps">Lead response · +42% pipeline (placeholder)</span>
              </div>
              <div className="agency__metric">
                <span className="agency__num display">$140k/yr</span>
                <span className="agency__cap caps">Manual-ops cost avoided (placeholder)</span>
              </div>
            </div>

            <div className="agency__steps">
              <p className="agency__subhead caps">Core Systems &amp; Deliverables</p>
              <div className="agency__deliverables">
                <div className="agency__deliv">
                  <strong>AI Lead &amp; CRM Engine</strong>
                  <span>Inbound enrichment, instant qualification, and routing under 60s.</span>
                </div>
                <div className="agency__deliv">
                  <strong>Support &amp; Ticket Triage</strong>
                  <span>Autonomous L1 resolution, context-aware drafts, and SLA escalation.</span>
                </div>
                <div className="agency__deliv">
                  <strong>Ops &amp; Document Pipelines</strong>
                  <span>Invoice extraction, ERP sync, and automated weekly reporting.</span>
                </div>
                <div className="agency__deliv">
                  <strong>Custom Internal Copilots</strong>
                  <span>Private RAG knowledge bases &amp; Slack/Teams action agents.</span>
                </div>
              </div>
            </div>

            <div className="agency__steps">
              <p className="agency__subhead caps">How We Work</p>
              <ul className="agency__list">
                <li><strong>01 / Audit (30 min)</strong> — We map your current stack and identify the top 3 highest-ROI automation targets.</li>
                <li><strong>02 / Build (14 days)</strong> — Custom AI agents, n8n/Make workflows, and CRM/ERP integrations shipped with full observability.</li>
                <li><strong>03 / Scale (24/7 Ops)</strong> — Continuous monitoring, error recovery, and new automations as your volume grows.</li>
              </ul>
            </div>

            <div className="agency__stackWrap">
              <p className="agency__subhead caps">Tech Stack</p>
              <div className="agency__tags">
                {['n8n', 'Make', 'OpenAI', 'Anthropic', 'Gemini', 'HubSpot', 'Salesforce', 'Slack', 'Postgres', 'Supabase'].map((t) => (
                  <span key={t} className="agency__tag caps">{t}</span>
                ))}
              </div>
            </div>

            <p className="agency__direct caps">
              Direct: <a href="mailto:hello@raijuu.ai">hello@raijuu.ai</a>
            </p>
          </section>

          <section className="agency__formWrap">
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
                  <span className="caps">Biggest Bottleneck</span>
                  <select value={bottleneck} onChange={(e) => setBottleneck(e.target.value)}>
                    <option value="Lead Qualification & CRM">Lead Qualification &amp; CRM Routing</option>
                    <option value="Support & Ticket Triage">Customer Support &amp; Ticket Triage</option>
                    <option value="Ops, Invoicing & Data Entry">Ops, Invoicing &amp; Document Pipelines</option>
                    <option value="Custom Internal AI Copilot">Custom Internal AI Copilot</option>
                  </select>
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
                <div className="agency__actions">
                  <button className="btn-frame display agency__submit" type="submit">
                    Request Audit
                  </button>
                  <a
                    className="agency__cal caps"
                    href="https://cal.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Or pick a time on Cal.com →
                  </a>
                </div>
              </form>
            )}
          </section>
        </div>
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
