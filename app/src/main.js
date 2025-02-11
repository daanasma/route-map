import { createApp } from 'vue'
import './style.css'  // Global styles
import 'vuetify/styles'

import './styles/main.scss';  // Import your custom SCSS file
import App from './App.vue'
import router from './router'
import '@mdi/font/css/materialdesignicons.css' // Material Design Icons
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { createPinia } from 'pinia'

const pinia = createPinia()
const vuetify = createVuetify({
  components,
  directives,
    styles: {
    configFile: 'src/styles/settings.scss',
  },
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
