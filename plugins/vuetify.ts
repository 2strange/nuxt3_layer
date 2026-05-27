import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const THEME_COLORS = {
  primary: '#1976D2',
  secondary: '#FF8F00',
  accent: '#424242',
  info: '#26A69A',
  warning: '#FFC107',
  error: '#FF3D00',
  success: '#00E676',
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    theme: {
      defaultTheme: 'dark',
      themes: {
        dark: { dark: true, colors: THEME_COLORS },
        light: { dark: false, colors: THEME_COLORS },
      },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
