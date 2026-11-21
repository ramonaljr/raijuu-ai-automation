import { useEffect, useId, useRef, useState } from 'react';
import { CASE_STUDIES } from './case-studies';
import type { PortfolioStudy } from './case-studies';

export default function CaseStudyGallery() {
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<PortfolioStudy | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const filtered = CASE_STUDIES.filter(study => category === 'All' || study.category === category);
  const visible = category === 'All' && !expanded ? filtered.slice(0, 6) : filtered;

  useEffect(() => {
    if (!active || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  return <>
    <div className="section-heading"><div><p className="eyebrow">Selected work · {CASE_STUDIES.length} case studies</p><h2>Systems built.<br /><em>Decisions explained.</em></h2></div><div><p>Documented automation builds across n8n, Make, and Zapier. Each uses a fictional client scenario, with workflow screenshots and source code you can explore.</p><div className="filter-group" aria-label="Filter case studies">{['All', 'Finance', 'Sales', 'Support', 'HR', 'Operations'].map(item => <button key={item} type="button" aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div></div>
    <p className="portfolio-count" aria-live="polite">Showing {visible.length} of {filtered.length} {category === 'All' ? 'case studies' : `${category.toLowerCase()} builds`}</p>
    <div className="application-grid">{visible.map(study => <article className="application-card case-card" key={study.slug}>
      <button className="case-preview" type="button" onClick={() => setActive(study)} aria-label={`View ${study.title} case study`}><img src={study.image} alt={`${study.platform} workflow canvas for ${study.title}`} width="1440" height="720" loading="lazy" /><span className="case-preview-label">View the workflow</span><span className="case-platform">{study.platform}</span></button>
      <div className="application-body"><p className="case-category">{study.category} <span>·</span> Demonstration build</p><h3>{study.title}</h3><p>{study.description}</p><div className="case-outcome"><strong>{study.outcome.value}</strong><span>{study.outcome.label}<small>Documented workflow behavior</small></span></div><div className="case-card-links"><button type="button" className="text-link" onClick={() => setActive(study)}>Read case study</button><a href={study.repoUrl} target="_blank" rel="noreferrer">Source code</a></div></div>
    </article>)}</div>
    {category === 'All' && <div className="portfolio-expand"><button type="button" className="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show selected case studies' : `Explore all ${CASE_STUDIES.length} case studies`}</button></div>}
    <dialog className="case-dialog" ref={dialogRef} aria-labelledby={titleId} onClose={() => setActive(null)}><div className="case-dialog-inner">{active && <>
      <div className="case-dialog-nav"><span>{active.platform} · {active.category}</span><button type="button" className="case-close" onClick={() => setActive(null)} aria-label="Close case study">Close <span aria-hidden="true">×</span></button></div>
      <div className="case-dialog-heading"><p className="eyebrow">{active.organisation} · Fictional client scenario</p><h2 id={titleId}>{active.title}</h2><p>{active.description}</p></div>
      <figure className="case-detail-image"><a href={active.image} target="_blank" rel="noreferrer" aria-label={`Open full-size ${active.title} workflow image`}><img src={active.image} alt={`${active.platform} workflow canvas for ${active.title}`} width="1440" height="720" /></a><figcaption>Actual workflow canvas · Open image to inspect at full size</figcaption></figure>
      <div className="case-logic"><span className="eyebrow">From trigger to outcome</span><p>{active.logic}</p></div>
      <div className="case-story"><section><h3>The problem</h3><p>{active.problem}</p></section><section><h3>The build</h3><p>{active.solution}</p></section></div>
      <div className="case-detail-outcomes">{active.roi.map(item => <article key={item.label}><strong>{item.value}</strong><h3>{item.label}</h3><p>{item.desc}</p></article>)}</div>
      <section className="case-safeguard"><p className="eyebrow">Built for the exceptions</p><h3>{active.failsafeHeadline}</h3>{active.failsafeDesc && <p>{active.failsafeDesc}</p>}</section>
      <div className="case-integrations" aria-label="Tools used">{active.integrations.map(tool => <span key={tool}>{tool}</span>)}</div>
      <div className="case-dialog-footer"><p>This is a documented build for a fictional client. Figures describe its configured behavior or documented tests, not measured client ROI.</p><a className="button" href={active.repoUrl} target="_blank" rel="noreferrer">Explore the source code</a></div>
    </>}</div></dialog>
  </>;
}
