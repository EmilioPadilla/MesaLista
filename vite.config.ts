import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export const resolvePath = (folder: string) => resolve(__dirname, `./src/${folder}`);
export const sharedPath = (folder: string) => resolve(__dirname, `./packages/shared/src/${folder}`);

export default defineConfig({
  plugins: [react(), tailwindcss()],

  define: {
    // Define global variable to display in the footer
    __PROJECT_VERSION__: JSON.stringify(process.env.PROJECT_VERSION || '0.0.0'),
  },

  // Module resolution and path aliases.
  // Spine `src/<x>` keys MUST precede the bare `src` key — Vite matches in
  // insertion order and the spine now lives in packages/shared.
  resolve: {
    alias: {
      'src/services': sharedPath('services'),
      'src/hooks': sharedPath('hooks'),
      'src/utils': sharedPath('utils'),
      'src/config': sharedPath('config'),
      'src/platform': sharedPath('platform'),
      services: sharedPath('services'),
      hooks: sharedPath('hooks'),
      utils: sharedPath('utils'),
      config: sharedPath('config'),
      platform: sharedPath('platform'),
      constants: sharedPath('config/constants'),
      types: resolve(__dirname, './types'),
      components: resolvePath('components'),
      core: resolvePath('components/core'),
      modules: resolvePath('app/modules'),
      routes: resolvePath('app/routes'),
      styles: resolvePath('styles'),
      src: resolvePath(''),
    },
  },

  // Production build
  build: {
    sourcemap: true, // Keep so we can debug production builds
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000, // Warn if chunk size exceeds 2MB
    commonjsOptions: {
      include: [/node_modules/, /react-froala-wysiwyg/],
    },
  },
});
