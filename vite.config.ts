import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export const resolvePath = (folder: string) => resolve(__dirname, `./src/${folder}`);

export default defineConfig({
  plugins: [react(), tailwindcss()],

  define: {
    // Define global variable to display in the footer
    __PROJECT_VERSION__: JSON.stringify(process.env.PROJECT_VERSION || '0.0.0'),
  },

  // Module resolution and path aliases
  resolve: {
    alias: {
      'src': resolvePath(''),
      'components': resolvePath('components'),
      'constants': resolvePath('constants'),
      'hooks': resolvePath('hooks'),
      'modules': resolvePath('modules'),
      'pages': resolvePath('pages'),
      'services': resolvePath('services'),
      'styles': resolvePath('styles'),
      'types': resolvePath('types'),
      'utils': resolvePath('utils'),
      // Direct Vite to use the CommonJS bundle at index.js:
      'react-froala-wysiwyg': path.resolve(__dirname, 'node_modules/react-froala-wysiwyg/index.js'),
    },
  },


  // Production build
  build: {
    sourcemap: true,  // Keep so we can debug production builds
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000, // Warn if chunk size exceeds 2MB
    commonjsOptions: {
      include: [/node_modules/, /react-froala-wysiwyg/],
    },
  },

  // Dev server settings
  // server: {
  //   host: '0.0.0.0',
  //   port: 5173,

  //   proxy: {
  //     // Proxy configuration for API calls
  //     '/afs/app/mvc/': {
  //       target: 'http://localhost:8080',
  //       changeOrigin: true,
  //       secure: false,
  //       ws: true,
  //     },
  //   },
  // },
});