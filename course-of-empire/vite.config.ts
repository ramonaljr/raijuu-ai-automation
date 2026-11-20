import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The engine (public/js: hero3d.js, hall.js, content3d.js), the styles (public/css), the vendored three.js r186 and
// every asset (public/assets) are served as they are; Vite bundles only the React shell (src/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', assetsDir: 'app' },   // public/assets holds the site's own files: the shell's bundle goes beside it
});
