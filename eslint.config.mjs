import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jestDom from 'eslint-plugin-jest-dom';
import json from 'eslint-plugin-json';
import prettier from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

/**
 * ESLint configuration
 *
 * @type {import('eslint').Linter.Config}
 */
export default [   
  {
    ignores: ['dist/**', 'node_modules/**', 'storybook-static/**'],

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

  ...storybook.configs['flat/recommended'],

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