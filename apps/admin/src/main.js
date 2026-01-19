/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins

// Components

import App from './App.vue'
import 'vuetify/styles'
import { VBreadcrumbs , VBtn, VCarousel, VCarouselItem, VDivider, VIcon, VSnackbar, VComponentIcon, VSvgIcon  } from 'vuetify/components'
import { Ripple } from 'vuetify/directives'

import 'ol/ol.css'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import router from './router'

const pinia = createPinia()
const vuetify = createVuetify({
  components: {
    VBreadcrumbs,
    VBtn,
    VCarousel,
    VCarouselItem,
    VDivider,
    VIcon,
    VSnackbar,
    VComponentIcon,
    VSvgIcon  },
  directives: { Ripple },
  styles: {
    configFile: 'src/styles/settings.scss',
  },
  icons: {
    defaultSet: 'mdi',
  },
})


// Composables
import { createApp } from 'vue'

const app = createApp(App)
app.use(pinia);
app.use(router)
app.use(vuetify)

app.mount('#app')
