import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router"; // Import the router
import 'vuetify/styles'; // Use prebuilt CSS instead of compiling Sass
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons CSS
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { createPinia } from 'pinia';


const pinia = createPinia();
const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App)
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount('#app')
