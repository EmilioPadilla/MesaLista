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
      hooks: resolvePath('hooks'),
      services: resolvePath('services'),
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
