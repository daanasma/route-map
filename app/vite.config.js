import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import minifyBundleDistJson from './build-tools.js';
import buildPlugins from "./build-tools.js";


const routeLimitation = 'carretera-austral'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    buildPlugins({routeLimitation}) //todo: this should finish before the copy and it doesnt.
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // Ensure this points to your src directory
    },
  },
  server: {
    port: 6999,
  },
 base: '/',
//base: process.env.NODE_ENV === 'production' ? './map' : '/',

});
