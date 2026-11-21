import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import SystemGraphic from './SystemGraphic';

const CURRENT_YEAR = new Date().getFullYear();

const SERVICES = [
  { title: 'Workflows that connect the dots.', label: 'Operations & orchestration', description: 'Connect your CRM, inbox, spreadsheets, and internal tools. Turn the handoffs between them into one dependable workflow.', tools: 'n8n / APIs / Postgres', symbol: 'connect', nodes: ['A new request', 'Your business rules', 'The right action'] },
  { title: 'AI that knows your business.', label: 'Knowledge & document systems', description: 'Make company knowledge usable. Search documents, extract the details that matter, and bring a human in when judgment is needed.', tools: 'OpenAI / Claude / Retrieval', symbol: 'knowledge', nodes: ['Your documents', 'Grounded answers', 'Human review'] },
  { title: 'A better first response.', label: 'Customer experience', description: 'Help customers get answers, route incoming enquiries, and prepare the next step with the context your team needs.', tools: 'Chat / Voice / CRM', symbol: 'response', nodes: ['An enquiry', 'Context & intent', 'Answer or handoff'] },
];
const EXAMPLES = [
  { category: 'Sales', title: 'Every lead, in the right hands.', text: 'Capture an enquiry, enrich the details, and route it to the right person with a useful briefing.', input: 'Incoming lead', output: 'CRM + team briefing', image: '02' },
  { category: 'Operations', title: 'Documents in. Usable data out.', text: 'Extract invoice details, check against your rules, and send exceptions to a person before approval.', input: 'Invoice or PDF', output: 'Validated data + review', image: '04' },
  { category: 'Support', title: 'Context before conversation.', text: 'Bring order history and approved policies together to draft a response your team can trust.', input: 'Customer question', output: 'Draft + source context', image: '06' },
];
const FAQS = [
  ['Where should we start?', 'Start with one frequent, measurable bottleneck. In the workflow audit, we map your current process, identify the handoffs, and agree on what a useful first build would look like.'],
  ['Can you work with our existing tools?', 'We start with your current stack and check the available APIs, webhooks, permissions, and data access before recommending an approach. You do not need to replace everything to automate one process.'],
  ['Who owns the workflows and code?', 'The intended handover includes workflows, code, configuration notes, and recovery instructions in your own accounts. The exact deliverables and access arrangements are agreed in the project scope.'],
  ['How do you handle sensitive data?', 'We agree on data access, retention, and review requirements before a build. Hosting and model choices depend on those requirements; human approval can be kept around sensitive actions.'],
  ['What happens after launch?', 'We document the workflow, make failures visible, and walk your team through operating it. Ongoing support and monitoring can be scoped separately around your needs.'],
];

function Mark({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'brand-mark small' : 'brand-mark'} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2 37 12v16L20 38 3 28V12L20 2Z" stroke="currentColor" /><path d="m20 9 11 7v8l-11 7-11-7v-8l11-7Z" stroke="currentColor" /><path d="m22 12-9 10h7l-2 7 10-12h-8l2-5Z" fill="currentColor" /></svg>;
}

export default function Agency({ onCinema }: { onCinema: () => void }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [team, setTeam] = useState(8);
  const [hours, setHours] = useState(5);
  const [cost, setCost] = useState(30);
  const [formState, setFormState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const webhook = import.meta.env.VITE_AUDIT_WEBHOOK_URL?.trim();
  const hoursSaved = team * hours * 0.65;
  const savings = Math.round(hoursSaved * cost * 50);
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map<Element, Animation>();
    const reset = () => {
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    };
    const sections = page.querySelectorAll('main > section, .agency-footer');
    const backgroundObserver = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle('motion-in-view', entry.isIntersecting);
    });
    sections.forEach(section => backgroundObserver.observe(section));
    const observer = new IntersectionObserver(entries => {
      if (preference.matches) return;
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        // A hidden agency must not animate while the cinema owns the screen.
        if (!target.getClientRects().length) continue;
        const leavingUp = entry.boundingClientRect.top < 0;
        const previous = animations.get(target);
        const entering = entry.isIntersecting && entry.intersectionRatio >= 0.12;
        if (!entering && !previous) continue;
        previous?.cancel();
        const distance = entering ? 30 : leavingUp ? -24 : 24;
        const animation = target.animate(entering ? [
          { opacity: 0, transform: `translateY(${leavingUp ? -30 : distance}px)`, filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
        ] : [
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          { opacity: 0, transform: `translateY(${distance}px)`, filter: 'blur(4px)' },
        ], { duration: entering ? 850 : 450, easing: 'cubic-bezier(.2,.7,.2,1)', fill: entering ? 'none' : 'both' });
        animations.set(target, animation);
      }
    }, { threshold: [0, 0.12] });
    page.querySelectorAll('.interlude-frame, .studio-manifesto, .hero-copy, .cinema-invite, .hero-bottom, .stack-strip, .section-heading, .service-row, .application-card, .cinema-feature-copy, .process-grid article, .engagement-section article, .calculator-section > div, .founder-section > div, .faq-section > div, .booking-section > div:not(.booking-art), .process-illustration, .footer-top, .footer-bottom').forEach(target => observer.observe(target));
    preference.addEventListener('change', reset);
    const syncVisibility = () => page.classList.toggle('motion-paused', document.hidden);
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {
      observer.disconnect();
      backgroundObserver.disconnect();
      preference.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', syncVisibility);
      reset();
    };
  }, [filter]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState === 'sending') return;
    if (!webhook) {
      setError('Online requests are unavailable. Please email Ramon using the link below.');
      setFormState('error');
      return;
    }
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (!String(values.name).trim()) {
      setError('Please enter your name.');
      return;
    }
    if (values.website) return;
    setFormState('sending');
    setError('');
    try {
      const response = await fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, name: String(values.name).trim(), email: String(values.email).trim(), estimatedAnnualSavings: savings, bottleneck: 'Workflow audit', source: 'raijuu-landing' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Delivery failed');
      setFormState('success');
      form.reset();
    } catch {
      setError('Your request could not be delivered. Please try again or email Ramon directly.');
      setFormState('error');
    }
  }

  return (
    <div className="agency-page" ref={pageRef}>
      <a className="skip-link" href="#agency-main">Skip to content</a>
      <header className="agency-nav">
        <a className="agency-brand" href="#agency-top" aria-label="Raijuu home"><Mark /><span>raijuu<span className="brand-sub">AI AUTOMATION</span></span></a>
        <button className="mobile-toggle" type="button" aria-expanded={menuOpen} aria-controls="agency-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close menu' : 'Menu'}<span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
        <nav id="agency-navigation" className={menuOpen ? 'agency-navigation is-open' : 'agency-navigation'} aria-label="Main navigation" onClick={() => setMenuOpen(false)} onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.mobile-toggle')?.focus(); } }}>
          <a href="#site-systems">What we build</a><a href="#site-portfolio">Applications</a><a href="#site-process">Our approach</a>
          <button className="nav-cinema" type="button" onClick={onCinema}><span className="play-icon" aria-hidden="true">▷</span> The cinema</button>
          <a className="button button-small" href="#site-book">Let’s talk</a>
        </nav>
      </header>

      <main id="agency-main" tabIndex={-1}>
        <section className="agency-hero" id="agency-top">
          <div className="hero-art" aria-hidden="true"><img src="assets/paintings/consummation.webp" alt="" width="1920" height="1080" fetchPriority="high" /></div>
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Independent automation studio</p>
            <h1>Less friction.<br />More <em>possibility.</em></h1>
            <p className="hero-description">Thoughtful AI systems for the work between the work. We connect your tools, simplify your operations, and give your team room to move.</p>
            <div className="hero-actions"><a className="button" href="#site-book">Find your first automation</a><a className="text-link" href="#site-systems">Explore what we build</a></div>
            <div className="hero-signature"><span className="signature-rule" /> Built around your business. Owned by you.</div>
          </div>
          <button className="cinema-invite" type="button" onClick={onCinema}><span className="cinema-play" aria-hidden="true">▷</span><span><span className="eyebrow">A different perspective</span><strong>Step into the cinema</strong><span className="cinema-invite-meta">An interactive 3D journey through change</span></span></button>
          <div className="hero-bottom"><span>Systems with intention.</span><span>Philippines · Working worldwide</span><a href="#site-systems">Discover the studio</a></div>
        </section>

        <section className="studio-interlude" aria-label="From complexity to clarity"><div className="interlude-gallery">{['01', '05', '09', '13'].map((frame, index) => <figure className="interlude-frame" key={frame}><img src={`assets/frames/${frame}.webp`} alt="" loading="lazy" width="450" height="650" /><figcaption>{['The work', 'The friction', 'The shift', 'The possibility'][index]}</figcaption></figure>)}</div><p className="studio-manifesto">The best systems don’t add more to your day.<br />They give you <em>something back.</em><span>Less chasing. Fewer handoffs. More room for the work you care about.</span></p></section>

        <section className="stack-strip" aria-label="Technology we work with"><span>Good systems.<br /><strong>Familiar tools.</strong></span><div>{['n8n', 'OpenAI', 'Claude', 'Make', 'Postgres', 'Supabase'].map(tool => <span key={tool}>{tool}</span>)}</div></section>

        <section className="section section-services" id="site-systems">
          <div className="section-heading"><div><p className="eyebrow">What we build</p><h2>A little less manual.<br />A lot more <em>momentum.</em></h2></div><p>Start with the process that slows you down. Build a system that moves it forward.</p></div>
          <div className="service-list">{SERVICES.map((service, i) => <article className="service-row" key={service.label}><span className="service-label"><span className="service-glyph" aria-hidden="true">{['⌘', '◇', '◎'][i]}</span>{service.label}</span><div><h3>{service.title}</h3><p>{service.description}</p><span className="tool-caption">{service.tools}</span></div><div className="service-visual"><SystemGraphic variant={(['network', 'knowledge', 'response'] as const)[i]} /><div className="flow-diagram" aria-label="Example workflow">{service.nodes.map((node, index) => <span className={index === 1 ? 'flow-node central' : 'flow-node'} key={node}>{index > 0 && <i aria-hidden="true" />}{node}</span>)}</div></div></article>)}</div>
          <p className="section-footnote">Business rules first. AI where it helps. A person where it matters.</p>
        </section>

        <section className="section section-applications" id="site-portfolio">
          <div className="section-heading"><div><p className="eyebrow">Possible applications</p><h2>Real problems.<br /><em>Considered solutions.</em></h2></div><div><p>A few ways automation can fit into a working business. These are illustrative solutions, not client case studies.</p><div className="filter-group" aria-label="Filter applications">{['All', 'Sales', 'Operations', 'Support'].map(item => <button type="button" key={item} aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div></div>
          <div className="application-grid">{EXAMPLES.filter(item => filter === 'All' || item.category === filter).map(item => <article className="application-card" key={item.title}><div className="application-image"><img src={`assets/frames/${item.image}.webp`} alt="" loading="lazy" width="600" height="360" /><span>{item.category}</span></div><div className="application-body"><h3>{item.title}</h3><p>{item.text}</p><div className="application-flow"><span>{item.input}</span><span className="flow-connector" aria-hidden="true" /><span>{item.output}</span></div><a className="text-link" href="#site-book">Discuss a similar workflow</a></div></article>)}</div>
        </section>

        <section className="cinema-feature" aria-labelledby="cinema-heading"><img src="assets/hall/painting.webp" alt="A classical painting of an empire at its height" loading="lazy" width="1200" height="700" /><div className="cinema-feature-copy"><p className="eyebrow">The Raijuu cinema</p><h2 id="cinema-heading">Every system<br />has a <em>turning point.</em></h2><p>Architecture. Friction. Autonomy. Explore the story behind the studio in an immersive, scroll-driven 3D experience.</p><button className="button button-light" type="button" onClick={onCinema}>Enter the 3D cinema <span aria-hidden="true">▷</span></button><span className="cinema-note">Sound optional · Best explored at your own pace</span></div></section>

        <section className="section" id="site-process"><div className="section-heading"><div><p className="eyebrow">Our approach</p><h2>Clarity before code.<br /><em>Confidence after launch.</em></h2></div><p>Small, deliberate steps. Clear decisions. A system your team can actually operate.</p></div><div className="process-illustration"><SystemGraphic variant="process" /><div><span>Understand the inputs</span><span>Design the system</span><span>Own the outcome</span></div></div><div className="process-grid">{[
          ['Discover', 'Map what matters.', 'We walk through your process, tools, and exceptions. Together, we choose a useful first problem and define how to measure the result.'],
          ['Build', 'Make the pieces work.', 'We connect the tools, encode your business rules, and use AI for unstructured inputs. Reviews and safeguards stay where they belong.'],
          ['Handover', 'Leave you in control.', 'We test the edge cases, make errors visible, and document how it works. Your team gets the workflow and the knowledge to run it.'],
        ].map(([label, title, text]) => <article key={label}><span className="process-label">{label}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

        <section className="section engagement-section" aria-label="Ways to work together"><article><p className="eyebrow">A focused project</p><h3>One process. A clear scope.</h3><p>A defined workflow, agreed deliverables, and a documented handover. A practical place to begin.</p></article><article><p className="eyebrow">An ongoing partnership</p><h3>Keep making work better.</h3><p>Build on your first system with a prioritized roadmap. Scope improvements, maintenance, and support around your team.</p></article></section>

        <section className="section calculator-section" id="site-roi"><div><p className="eyebrow">A useful starting point</p><h2>What could your<br />team <em>get back?</em></h2><p className="section-intro">Explore the value of time spent on repetitive work. A starting conversation, not a promise.</p><div className="range-fields">{[
          { label: 'People on your team', value: team, max: 50, min: 1, unit: 'people', set: setTeam },
          { label: 'Repetitive work per person', value: hours, max: 30, min: 1, unit: 'hours / week', set: setHours },
          { label: 'Hourly time value (USD)', value: cost, max: 200, min: 10, unit: 'USD / hour', set: setCost },
        ].map(({ label, value, max, min, unit, set }) => <label key={label} className="range-field"><span>{label}<strong>{value} <small>{unit}</small></strong></span><input type="range" min={min} max={max} value={value} onChange={e => set(Number(e.target.value))} /></label>)}</div></div><div className="calculator-result"><div className="value-orbit" aria-hidden="true"><span /><span /><span /></div><Mark /><span className="eyebrow">Potential annual time value</span><output aria-live="polite">{money.format(savings)}</output><p>About <strong>{Math.round(hoursSaved)} hours each week</strong> for work that needs your people.</p><div className="calculator-assumptions">Illustrative estimate: 65% of repetitive hours recovered over 50 working weeks. Excludes implementation, tools, and ongoing costs. Time value is not guaranteed cash savings.</div><a className="button" href="#site-book">Explore your opportunity</a></div></section>

        <section className="section founder-section" id="site-about"><div className="founder-monogram" aria-hidden="true"><img src="assets/paintings/desolation.webp" alt="" loading="lazy" /><span className="founder-engraving">RV</span><span>Thoughtfully engineered.</span><div className="founder-seal">Systems · Craft · Intent</div></div><div><p className="eyebrow">The person behind the systems</p><h2>Hi, I’m <em>Ramon.</em></h2><p className="founder-role">Ramon Vallejera Jr · AI Automation Engineer</p><p>I build around a simple principle: understand the work before automating it. Keep calculations exact, use AI for the messy inputs, and make the system easy to understand when something needs attention.</p><div className="founder-links"><a className="text-link" href="https://ramonvallejera.com/" target="_blank" rel="noreferrer">Explore my portfolio</a><span>Philippines · Remote worldwide</span></div></div></section>

        <section className="section faq-section" id="site-faq"><div><p className="eyebrow">Before we begin</p><h2>Good questions.<br /><em>Clear answers.</em></h2><SystemGraphic variant="orbit" /></div><div className="faq-list">{FAQS.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className="section booking-section" id="site-book"><div className="booking-art" aria-hidden="true"><img src="assets/frames/10.webp" alt="" loading="lazy" /></div><div><p className="eyebrow">Let’s make room for better work</p><h2>Bring the bottleneck.<br />We’ll bring<br /><em>a fresh perspective.</em></h2><p className="section-intro">Tell us what takes too much time. We’ll start with a focused workflow conversation and see where automation can help.</p><a className="booking-email" href="mailto:ramonvallejerajr@gmail.com">ramonvallejerajr@gmail.com</a><p className="booking-note">A direct conversation with the engineer building your system.</p></div><div className="booking-panel"><h3>Start a conversation</h3><p>Share a little about your workflow.</p>{!webhook ? <div className="email-fallback"><span className="contact-symbol" aria-hidden="true">✉</span><h4>Let’s start with an email.</h4><p>Tell Ramon about your business, the tools you use, and the task you would love to stop doing manually.</p><a className="button" href="mailto:ramonvallejerajr@gmail.com?subject=Let%E2%80%99s%20talk%20about%20automation">Email Ramon</a><span>Your workflow, your questions, a direct reply.</span></div> : formState === 'success' ? <div className="form-success" role="status"><h4>Your request was delivered.</h4><p>Thanks for sharing your workflow. Ramon will review your request and follow up by email.</p><button type="button" className="text-link" onClick={() => setFormState('idle')}>Send another request</button></div> : <form onSubmit={submit}><div className="form-row"><label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Work email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div><label>Company <span>(optional)</span><input name="company" autoComplete="organization" maxLength={200} /></label><label>What would you like to simplify?<textarea name="notes" required rows={4} maxLength={3000} placeholder="Our tools, our process, and where things get stuck…" /></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><p className="form-privacy">We use these details to respond to your enquiry. Please leave out passwords, credentials, or sensitive customer information.</p>{error && <p role="alert" className="form-error">{error}</p>}<button className="button" type="submit" disabled={formState === 'sending'}>{formState === 'sending' ? 'Sending your request…' : 'Request a conversation'}</button><a className="form-email" href="mailto:ramonvallejerajr@gmail.com">Prefer email? Contact Ramon directly.</a></form>}</div></section>
      </main>
      <footer className="agency-footer"><div className="footer-top"><a className="agency-brand" href="#agency-top"><Mark /><span>raijuu<span className="brand-sub">AI AUTOMATION</span></span></a><p>Less friction. More possibility.</p><a href="#agency-top">Back to top</a></div><div className="footer-bottom"><span>© {CURRENT_YEAR} Raijuu. Thoughtfully engineered.</span><button type="button" onClick={onCinema}>Visit the 3D cinema</button><a href="https://ramonvallejera.com/" target="_blank" rel="noreferrer">ramonvallejera.com</a></div></footer>
    </div>
  );
}
