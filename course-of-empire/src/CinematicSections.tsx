import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import './cinematic-sections.css';

const SYSTEMS = [
  { label: 'Orchestration', eyebrow: 'Operations & orchestration', title: 'Make the pieces\nmove as one.', description: 'Connect your CRM, inbox, spreadsheets, and internal tools. Turn the handoffs between them into one dependable workflow.', tools: 'n8n · APIs · Postgres', image: '03', flow: ['A new request', 'Your business rules', 'The right action'] },
  { label: 'Knowledge', eyebrow: 'Knowledge & document systems', title: 'Bring knowledge\ninto the work.', description: 'Make company knowledge usable. Search documents, extract the details that matter, and bring a human in when judgment is needed.', tools: 'OpenAI · Claude · Retrieval', image: '09', flow: ['Your documents', 'Grounded answers', 'Human review'] },
  { label: 'Customer experience', eyebrow: 'Customer experience', title: 'A response with\nunderstanding.', description: 'Help customers get answers, route incoming enquiries, and prepare the next step with the context your team needs.', tools: 'Chat · Voice · CRM', image: '12', flow: ['An enquiry', 'Context & intent', 'Answer or handoff'] },
];

export function SystemsGallery() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);
  const system = SYSTEMS[active];
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { reducedRef.current = preference.matches; };
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reducedRef.current || event.pointerType !== 'mouse') return;
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    stage.style.setProperty('--gallery-x', `${((event.clientX - box.left) / box.width - 0.5) * 5}deg`);
    stage.style.setProperty('--gallery-y', `${-((event.clientY - box.top) / box.height - 0.5) * 4}deg`);
  }
  function reset() {
    stageRef.current?.style.setProperty('--gallery-x', '0deg');
    stageRef.current?.style.setProperty('--gallery-y', '0deg');
  }

  return <section className="cinematic-systems" id="site-systems" aria-labelledby="systems-title">
    <div className="cinematic-heading"><p className="eyebrow">What we build</p><h2 id="systems-title">From friction<br />to autonomy.</h2><p>Bring your tools together in a system built around your team.</p></div>
    <div className="system-selector" role="group" aria-label="Explore automation systems">{SYSTEMS.map((item,index) => <button type="button" key={item.label} aria-pressed={index === active} className={index === active ? 'is-selected' : ''} onClick={() => setActive(index)}><span className="selector-line" aria-hidden="true" />{item.label}</button>)}</div>
    <div className="gallery-stage" ref={stageRef} onPointerMove={move} onPointerLeave={reset}>
      <div className="gallery-room" aria-hidden="true"><div className="gallery-light" /><div className="gallery-floor" /></div>
      <div className="gallery-exhibit" aria-hidden="true"><div className="gallery-art">{SYSTEMS.map((item,index) => <img key={item.image} className={index === active ? 'is-current' : ''} src={`assets/frames/${item.image}.webp`} alt="" loading="lazy" width="1000" height="650" />)}<span className="gallery-glass" /></div><span className="gallery-plaque">{system.eyebrow}</span></div>
      <div className="gallery-narrative" key={system.label} aria-live="polite" aria-atomic="true"><p className="eyebrow">{system.eyebrow}</p><h3>{system.title.split('\n').map((line,index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h3><p>{system.description}</p><div className="gallery-flow" aria-label="Example workflow">{system.flow.map((step,index) => <span key={step}>{index > 0 && <i aria-hidden="true" />}{step}</span>)}</div><p className="gallery-tools">{system.tools}</p><a className="text-link" href="#site-book">Discuss this system</a></div>
    </div>
    <p className="cinematic-footnote">Business rules first. AI where it helps. A person where it matters.</p>
  </section>;
}

const JOURNEY = [
  { label: 'Discover', title: 'See the whole picture.', text: 'We walk through your process, tools, and exceptions. Together, we choose a useful first problem and define how to measure the result.', note: 'A shared understanding of the work.', image: '02' },
  { label: 'Build', title: 'Give the work a structure.', text: 'We connect the tools, encode your business rules, and use AI for unstructured inputs. Reviews and safeguards stay where they belong.', note: 'Clear logic. Visible decisions. Room for review.', image: '07' },
  { label: 'Handover', title: 'Leave you in command.', text: 'We test the edge cases, make errors visible, and document how it works. Your team gets the workflow and the knowledge to run it.', note: 'Your accounts. Your workflows. Your next chapter.', image: '13' },
];

export function DeliveryJourney() {
  const [active, setActive] = useState(0);
  const journeyRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = journeyRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
    }, { rootMargin: '-25% 0px -40% 0px', threshold: 0 });
    root.querySelectorAll('[data-step]').forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <section className="cinematic-journey" id="site-process" ref={journeyRef} aria-labelledby="journey-title">
    <div className="cinematic-heading"><p className="eyebrow">Our approach</p><h2 id="journey-title">A deliberate path.<br />A lasting system.</h2><p>From understanding the work to putting you in control.</p></div>
    <div className="journey-layout"><div className="journey-scene" aria-hidden="true"><div className="journey-window">{JOURNEY.map((item,index) => <img className={index === active ? 'is-current' : ''} key={item.label} src={`assets/frames/${item.image}.webp`} alt="" loading="lazy" width="900" height="1100" />)}<div className="journey-shade" /><span className="journey-scene-label">{JOURNEY[active].label}</span></div><div className="journey-progress">{JOURNEY.map((item,index) => <span key={item.label} className={index === active ? 'is-current' : ''}>{item.label}</span>)}</div></div>
    <div className="journey-steps">{JOURNEY.map((item,index) => <article className={index === active ? 'journey-step is-current' : 'journey-step'} key={item.label} data-step={index}><div className="journey-mobile-art" aria-hidden="true"><img src={`assets/frames/${item.image}.webp`} alt="" loading="lazy" width="900" height="600" /></div><p className="eyebrow">{item.label}</p><h3>{item.title}</h3><p>{item.text}</p><span className="journey-note">{item.note}</span></article>)}</div></div>
  </section>;
}

export function EngagementEntrances() {
  return <section className="cinematic-engagements" aria-labelledby="engagement-title"><div className="cinematic-heading"><p className="eyebrow">Ways to work together</p><h2 id="engagement-title">Choose your<br />next chapter.</h2><p>One carefully scoped build, or a partnership that grows with your business.</p></div><div className="engagement-entrances">
    <a className="engagement-entrance" href="#site-book"><img src="assets/frames/04.webp" alt="" loading="lazy" width="800" height="1000" /><span className="entrance-light" aria-hidden="true" /><div className="entrance-copy"><p className="eyebrow">A focused project</p><h3>One process.<br />A clear scope.</h3><p>A defined workflow, agreed deliverables, and a documented handover. A practical place to begin.</p><span className="entrance-action">Discuss a project</span></div></a>
    <a className="engagement-entrance" href="#site-book"><img src="assets/frames/11.webp" alt="" loading="lazy" width="800" height="1000" /><span className="entrance-light" aria-hidden="true" /><div className="entrance-copy"><p className="eyebrow">An ongoing partnership</p><h3>Keep making<br />work better.</h3><p>Build on your first system with a prioritized roadmap. Scope improvements, maintenance, and support around your team.</p><span className="entrance-action">Explore a partnership</span></div></a>
  </div></section>;
}
