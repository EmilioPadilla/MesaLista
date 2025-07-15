/**
 * Prettier configuration file
 */

export default {

  // Maximum line length before wrapping (wider for modern screens, adjust if needed)
  printWidth: 140,

  // Number of spaces per indentation level
  tabWidth: 2,

  // Use spaces instead of tabs
  useTabs: false,

  // Print semicolons at the ends of statements
  semi: true,

  // Use single quotes instead of double quotes in JavaScript/TypeScript
  singleQuote: true,

  // Print trailing commas wherever possible (including function parameters)
  trailingComma: 'all',

  // Print spaces between brackets in object literals: { foo: bar }
  bracketSpacing: true,

  // Keep the closing bracket of JSX elements on the same line
  bracketSameLine: true,

  // Always include parentheses around arrow function arguments
  arrowParens: 'always',

  // Only quote object properties when required, unless consistency is preferred
  quoteProps: 'consistent',

  // Wrap markdown text as-is (no automatic wrapping)
  proseWrap: 'preserve',

  // Use LF (Line Feed) as the line ending (Unix/Linux style)
  endOfLine: 'lf',

  // Optional: Define specific formatting for different languages
  // overrides: [
  //   {
  //     files: '*.json',
  //     options: {
  //       printWidth: 100, // Shorter line width for JSON files for better readability
  //     },
  //   },
  //   {
  //     files: ['*.yml', '*.yaml'],
  //     options: {
  //       tabWidth: 2,
  //     },
  //   },
  // ],
};