import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';

/**
 * Minimal, dependency-light ESLint config for the @mesalista/shared spine.
 *
 * Kept separate from the full web config (eslint.config.mjs) so the mobile
 * `build:ios` guard can run it without the web-only plugins (react, storybook,
 * jest-dom) being installed. Its sole job is to block the intra-package alias
 * imports that resolve on a dev Mac but break the EAS "Bundle JavaScript" phase
 * on the case-sensitive build server.
 *
 * Run: `npm run lint:shared`
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': ts },
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
];
