import { createResolver } from '@nuxt/kit'

// Layer config — gets merged into consuming projects via `extends:`.
// IMPORTANT: keep this free of project-specific values (URLs, app name, port).
// Those belong in each consuming project's own nuxt.config.ts via runtimeConfig.
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // @pinia/nuxt only scans the CONSUMING project's stores/ by default, so layer
  // stores (useAuthStore, useAppStore) go missing in projects that `extends` us.
  // Point it at THIS layer's stores via an absolute path; keep 'stores' so each
  // project's own stores/ are still picked up.
  pinia: {
    storesDirs: [resolve('./stores'), 'stores'],
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', async (config) => {
        const vuetify = (await import('vite-plugin-vuetify')).default
        config.plugins = config.plugins || []
        config.plugins.push(vuetify({ autoImport: true, styles: { configFile: resolve('./assets/styles/vuetify.scss') } }))
      })
    },
  ],

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/styles/app.scss',
  ],

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    ssr: { noExternal: ['vuetify'] },
  },

  // Defaults for runtimeConfig. Consuming projects MUST override
  // public.apiBase and apiBaseServer in their own nuxt.config.ts.
  runtimeConfig: {
    public: {
      apiBase: '',
      appName: 'App',
      deployMode: 'development',
    },
    apiBaseServer: '',
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'de',
    locales: [
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    restructureDir: false,
    langDir: 'locales',
    detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_redirected', redirectOn: 'root' },
  },

  typescript: { strict: false },
})
