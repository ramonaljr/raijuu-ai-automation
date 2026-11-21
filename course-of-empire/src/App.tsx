import { useRef, useState } from 'react';
import Agency from './Agency';
import { startCinema } from './cinema';

export default function App() {
  const [siteOpen, setSiteOpen] = useState(true);
  const agencyScroll = useRef(0);
  const cinemaScroll = useRef(0);
  const cinemaTrigger = useRef<HTMLElement | null>(null);

  const openSite = (section?: string) => {
    cinemaScroll.current = window.scrollY;
    const overlay = document.getElementById('overlay');
    if (overlay && !overlay.hidden) document.getElementById('ovClose')?.click();
    setSiteOpen(true);
    document.body.classList.remove('is-loading', 'is-locked', 'has-cursor');
    document.body.classList.add('agency-active');
    document.dispatchEvent(new CustomEvent('cinema-visibility', { detail: false }));
    requestAnimationFrame(() => {
      window.scrollTo(0, agencyScroll.current);
      if (section) document.getElementById(section)?.scrollIntoView();
      else cinemaTrigger.current?.focus({ preventScroll: true });
    });
  };

  const closeSite = () => {
    agencyScroll.current = window.scrollY;
    cinemaTrigger.current = document.activeElement as HTMLElement;
    setSiteOpen(false);
    document.body.classList.remove('agency-active');
    requestAnimationFrame(() => {
      window.scrollTo(0, cinemaScroll.current);
      startCinema();
      document.dispatchEvent(new CustomEvent('cinema-visibility', { detail: true }));
      const entered = document.getElementById('preloader')?.classList.contains('is-done');
      document.querySelector<HTMLButtonElement>(entered ? '.header__about' : '.preloader__skip')?.focus({ preventScroll: true });
    });
  };

  return (
    <>
      <div hidden={!siteOpen}><Agency onCinema={closeSite} /></div>
      <div hidden={siteOpen}>
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
          Return to the agency
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

      <div className="no-gl caps" id="noGl"><div><p>The cinema needs WebGL 2.<br />You can still explore everything the studio offers.</p><button type="button" className="btn-frame display" style={{ marginTop: 24 }} onClick={() => openSite()}>Return to the agency</button></div></div>
      </div>
    </>
  );
}
