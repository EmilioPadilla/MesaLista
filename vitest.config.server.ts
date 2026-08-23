import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Server test config. The root config runs everything under jsdom with a React
 * setup file, which server tests neither need nor should depend on — they mock
 * `@prisma/client` and drive Express handlers with fake req/res objects.
 *
 * Referenced by `npm run test:server`.
 */
export default defineConfig({
  resolve: {
    alias: {
      types: resolve(__dirname, './types'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts'],
  },
});
