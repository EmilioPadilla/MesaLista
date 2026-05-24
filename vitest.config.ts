import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const resolvePath = (folder: string) => resolve(__dirname, `./src/${folder}`);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: resolvePath(''),
      components: resolvePath('components'),
      core: resolvePath('components/core'),
      constants: resolvePath('constants'),
      hooks: resolvePath('hooks'),
      modules: resolvePath('modules'),
      routes: resolvePath('app/routes'),
      services: resolvePath('services'),
      styles: resolvePath('styles'),
      types: resolvePath('types'),
      utils: resolvePath('utils'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
