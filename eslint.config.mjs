import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jestDom from 'eslint-plugin-jest-dom';
import json from 'eslint-plugin-json';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * ESLint configuration
 *
 * @type {import('eslint').Linter.Config}
 */
export default [
  // Global ignores. This MUST be an object with `ignores` and nothing else —
  // flat config only treats it as a global ignore when it stands alone. Sitting
  // beside `files` in the block below, it applied to that block only, which is
  // how 2,200+ errors from the generated Prisma runtime bundles were reaching
  // the report. Everything here is build output and gitignored.
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'src/generated/**',
      'mobile/_vendor/**',
      'mobile/.expo/**',
      'coverage/**',
    ],
  },

  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,

        // Custom Globals
        __PROJECT_VERSION__: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': ts,
      react,
      'react-hooks': reactHooks,
      'jest-dom': jestDom,
      json,
    },

    rules: {
      // Recommended Rules
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Custom Rules
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // TypeScript already resolves identifiers, and core ESLint can't see TS
      // type space — so `no-undef` only ever fired on types here (`React.FC`,
      // `NodeJS.Timeout`, `BodyInit`), never on a real bug. Turning it off for
      // TS is what typescript-eslint itself recommends.
      'no-undef': 'off',
      // Props are typed by TypeScript; prop-types would be a second, weaker
      // declaration of the same thing.
      'react/prop-types': 'off',
    },

    settings: {
      'react': {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },

  // CommonJS is correct in these, so the ESM-only import rule doesn't apply:
  //   *.js  — metro/tailwind configs, build scripts and server/start.js are CJS.
  //   mobile — React Native resolves static assets ONLY via `require('...png')`,
  //            and native modules are require()d lazily so a missing native side
  //            can't crash the bundle at import time.
  {
    files: ['**/*.js', 'mobile/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // @mesalista/shared spine: forbid bare intra-package alias imports.
  // Aliases like `services/x` / `config/x` are rewritten to
  // `@mesalista/shared/src/services/x` by the MOBILE app's Babel/Metro config,
  // so they resolve on a dev Mac but NOT on the case-sensitive EAS build server
  // (the "Unable to resolve module @mesalista/shared/src/..." bundle failure).
  // Inside this package, always import siblings relatively (e.g. ../services/x).
  // Cross-package `types/*` (-> @mesalista/types) is intentionally allowed.
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'services/*',
                'hooks/*',
                'utils/*',
                'config/*',
                'platform/*',
                'src/services/*',
                'src/hooks/*',
                'src/utils/*',
                'src/config/*',
                'src/platform/*',
              ],
              message:
                'Inside @mesalista/shared, import sibling modules relatively (e.g. ../services/x). Bare aliases resolve only via the mobile app Babel/Metro config and break the EAS "Bundle JavaScript" phase.',
            },
          ],
        },
      ],
    },
  },

  // Prettier Config (Must be last)
  prettier,
];