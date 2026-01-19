import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';
import minifyBundleDistJson from './build-tools.js';
import buildPlugins from "./build-tools.js";
import { execSync } from 'child_process';
const buildId = Date.now();
const routeLimitation = ['leuven-city', 'carretera-austral']


export default defineConfig({
    plugins: [vue(),
        buildPlugins({routeLimitation}) //todo: this should finish before the copy and it doesnt.
    ],
    define: {
        __APP_VERSION__: JSON.stringify(`${buildId}`)
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@repo/common": fileURLToPath(new URL("../../packages/common/src", import.meta.url))
        },
    },
    server: {
        port: 6999,
    },
    base: '/',
//base: process.env.NODE_ENV === 'production' ? './map' : '/',

});
