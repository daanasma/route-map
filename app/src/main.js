import { createApp } from 'vue'
import './style.css'  // Global styles
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiHomeExportOutline } from '@mdi/js'

import './styles/main.scss';  // Import your custom SCSS file
import App from './App.vue'
import router from './router'
import '@mdi/font/css/materialdesignicons.css' // Material Design Icons
import { createVuetify } from 'vuetify'
import { VBreadcrumbs , VBtn, VCarousel, VCarouselItem, VIcon, VSnackbar, VComponentIcon, VSvgIcon  } from 'vuetify/components'
import { Ripple } from 'vuetify/directives'

import { createPinia } from 'pinia'
performance.mark('app-start')
const pinia = createPinia()
const vuetify = createVuetify({
  components: {
    VBreadcrumbs,
    VBtn,
    VCarousel,
    VCarouselItem,
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
    aliases: {
      ...aliases,
      home: mdiHomeExportOutline,
    },
    sets: {
      mdi,
    },
  },
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
