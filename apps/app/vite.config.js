import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import buildPlugins from "./build-tools.js";

const buildId = Date.now();
const routeLimitation = ['leuven-city', 'carretera-austral'];
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        vue(),
        buildPlugins({ routeLimitation })
    ],
    define: {
        __APP_VERSION__: JSON.stringify(`${buildId}`)
    },
    resolve: {
        alias: {
            // Use absolute paths to prevent Vercel resolution issues
            "@": path.resolve(__dirname, "./src"),
            "@repo/common": path.resolve(__dirname, "../../packages/common/src")
        },
        // Ensures only one version of Vue/Pinia is loaded
        dedupe: ['vue', 'pinia', 'vuetify']
    },
    server: {
        port: 6999,
        fs: {
            // Allow Vite to reach the /packages folder
            allow: [
                fileURLToPath(new URL('./', import.meta.url)),
                fileURLToPath(new URL('../../packages/common', import.meta.url))
            ]
        }
    },
    build: {
        // This ensures the shared code is bundled and not treated as an external module
        rollupOptions: {
            external: []
        }
    },
    base: '/',
});
