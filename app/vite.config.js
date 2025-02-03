import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { fileURLToPath, URL } from 'node:url';
import minifyBundleDistJson from './build-tools.js';
import buildPlugins from "./build-tools.js";


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    UnoCSS(),
    buildPlugins()
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
