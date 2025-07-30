import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const resolvePath = (folder) => resolve(__dirname, `./src/${folder}`);
const resolveRootPath = (folder) => resolve(__dirname, `./${folder}`);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Define global variable to display in the footer
    __PROJECT_VERSION__: JSON.stringify(process.env.PROJECT_VERSION || '0.0.0'),
  },
  // Module resolution and path aliases
  resolve: {
    alias: {
      src: resolvePath(''),
      components: resolvePath('components'),
      core: resolvePath('components/core'),
      constants: resolvePath('constants'),
      features: resolvePath('features'),
      hooks: resolvePath('hooks'),
      modules: resolvePath('modules'),
      routes: resolvePath('app/routes'),
      services: resolvePath('services'),
      config: resolvePath('config'),
      utils: resolvePath('utils'),
      styles: resolvePath('styles'),
      types: resolveRootPath('types'),
    },
  },
  // Production build
  build: {
    outDir: 'dist',
    sourcemap: true, // Keep so we can debug production builds
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000, // Warn if chunk size exceeds 2MB
    commonjsOptions: {
      include: [/node_modules/, /react-froala-wysiwyg/],
    },
  },
});
