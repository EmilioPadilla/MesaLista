/** @type {import('tailwindcss').Config} */
// Tokens mirror the web app's src/styles/config/cssValues.ts so the two apps
// share one visual language. Keep in sync when brand colors change.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Use class-based dark mode (not the OS media query). The app is light-only,
  // so this prevents NativeWind from throwing when the color scheme is set
  // programmatically ("Cannot manually set color scheme, as dark mode is type 'media'").
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oak: '#d4704a',
        oakDark: '#c05f3d',
        chai: '#d2a880',
        pistaccio: '#b3b792',
        ink: '#101418',
        background: '#fefdfb',
        foreground: '#2c2c2c',
        muted: '#f8f6f3',
        mutedForeground: '#8b7355',
        accent: '#e8ddd4',
        gray: {
          DEFAULT: '#f3f4f5',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#dfe2e5',
          300: '#d4d8dc',
          400: '#bfc5cb',
          500: '#949ca4',
          600: '#535c64',
          700: '#30373e',
          800: '#1b2127',
        },
        danger: '#dc3545',
        dangerDark: '#bd2130',
        success: '#29bc4c',
        info: '#00aaff',
        warning: '#ff7a06',
        orange: '#ff7a06',
      },
      borderRadius: {
        ml: '12px',
      },
    },
  },
  plugins: [],
};
