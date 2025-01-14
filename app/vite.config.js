import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import path from 'path';
import jsonminify from 'jsonminify';

// const jsonminify = require("jsonminify");

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    UnoCSS(),
          {
      name: 'minify-json', // Plugin to minify GeoJSON files
      apply: 'build', // Apply this during the build process
      generateBundle() {
        // Specify the folder containing your GeoJSON files
        const dir = './public/geojson';
        const files = fs.readdirSync(dir);

        // Loop through the files in the geojson folder and minify them
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          if (path.extname(file) === '.geojson') {
            const content = fs.readFileSync(filePath, 'utf8');
            const minifiedContent = jsonminify(content); // Minify the content
            fs.writeFileSync(filePath, minifiedContent); // Write back the minified content
            console.log(`Minified: ${file}`);
          }

        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // Ensure this points to your src directory
    },
  },
  server: {
    port: 6999,
  },
base: process.env.NODE_ENV === 'production' ? '/route-map/' : '/',

});
