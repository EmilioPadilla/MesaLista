import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export const resolvePath = (folder) => resolve(__dirname, `./src/${folder}`);
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        // Define global variable to display in the footer
        __PROJECT_VERSION__: JSON.stringify(process.env.PROJECT_VERSION || '0.0.0'),
    },
    // Module resolution and path aliases
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
    // Production build
    build: {
        sourcemap: true, // Keep so we can debug production builds
        emptyOutDir: true,
        chunkSizeWarningLimit: 2000, // Warn if chunk size exceeds 2MB
        commonjsOptions: {
            include: [/node_modules/, /react-froala-wysiwyg/],
        },
    },
});
