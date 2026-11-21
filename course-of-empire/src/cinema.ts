let started = false;

export function startCinema() {
  if (started) return;
  started = true;
  document.body.classList.add('is-loading');
  const engine = document.createElement('script');
  engine.type = 'module';
  engine.src = `${import.meta.env.BASE_URL}js/hero3d.js?v=42`;
  engine.onerror = () => {
    document.getElementById('preStatus')!.textContent = 'Cinema unavailable. Return to the agency to continue.';
    engine.remove();
    started = false;
  };
  document.body.append(engine);
}
