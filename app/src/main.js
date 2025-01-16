import { createApp } from 'vue'
import './style.css'
import 'uno.css';
import App from './App.vue'
import router from "./router"; // Import the router

import { createPinia } from 'pinia';


const pinia = createPinia();
const app = createApp(App)
app.use(pinia);
app.use(router);
app.mount('#app')
