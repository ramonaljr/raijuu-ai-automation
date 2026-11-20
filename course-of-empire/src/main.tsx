import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');
flushSync(() => createRoot(root).render(<App />));

// The engine (public/js/hero3d.js: the hall, the flight, the film, the interface, the sound; plain JavaScript with the
// vendored three.js r186) starts once the markup is in the page, exactly as the original page's module script did.
const engine = document.createElement('script');
engine.type = 'module';
engine.src = `${import.meta.env.BASE_URL}js/hero3d.js?v=41`;
document.body.append(engine);
