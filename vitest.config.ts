import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const resolvePath = (folder: string) => resolve(__dirname, `./src/${folder}`);
const sharedPath = (folder: string) => resolve(__dirname, `./packages/shared/src/${folder}`);

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Spine `src/<x>` keys MUST precede the bare `src` key (matched in order).
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
