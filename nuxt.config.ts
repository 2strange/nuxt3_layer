import { createResolver } from '@nuxt/kit'

// Layer config — gets merged into consuming projects via `extends:`.
// IMPORTANT: keep this free of project-specific values (URLs, app name, port).
// Those belong in each consuming project's own nuxt.config.ts via runtimeConfig.
const { resolve } = createResolver(import.meta.url)

// Neutral house-default theme. Consuming projects override app-side via their
// own `vuetify.vuetifyOptions.theme` — NO custom plugins/vuetify.ts needed.
const THEME_COLORS = {
  primary: '#1976D2',
  secondary: '#FF8F00',
  accent: '#424242',
  info: '#26A69A',
  warning: '#FFC107',
  error: '#FF3D00',
  success: '#00E676',
}

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // @pinia/nuxt only scans the CONSUMING project's stores/ by default, so layer
  // stores (useAuthStore, useAppStore) go missing in projects that `extends` us.
  // Point it at THIS layer's stores via an absolute path; keep 'stores' so each
  // project's own stores/ are still picked up.
  pinia: {
    storesDirs: [resolve('./stores'), 'stores'],
  },

  // Vuetify 3 via the OFFICIAL module. Replaces the former hand-rolled setup
  // (vite-plugin-vuetify hook + manual createVuetify plugin), which under
  // `styles: { configFile }` had vite-plugin-vuetify swap `vuetify/styles` for a
  // virtual SASS module that Nuxt's CSS pipeline did NOT extract → the global
  // main.sass aggregate (reset + grid/spacing/flex utilities like pa-*/d-flex/ga-*)
  // was silently dropped from the built bundle (content-box overflow, no-op
  // utilities). The module emits the global styles correctly out-of-the-box
  // (auto-import/treeshaking included) and keeps both layers symmetric.
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    'vuetify-nuxt-module',
  ],

  vuetify: {
    vuetifyOptions: {
      icons: { defaultSet: 'mdi' },
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: { dark: true, colors: THEME_COLORS },
          light: { dark: false, colors: THEME_COLORS },
        },
      },
    },
  },

  // NOTE: the module registers `vuetify/styles` itself (moduleOptions.styles
  // defaults to `true` = precompiled CSS), so we do NOT add it here. The Inter
  // body font (previously a $body-font-family SASS override) lives as a plain
  // rule in app.scss — that avoids the configFile+SSR caveat (which would force
  // experimental.inlineSSRStyles: false).
  css: [
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/styles/app.scss',
  ],

  // Defaults for runtimeConfig. Consuming projects MUST override
  // public.apiBase and apiBaseServer in their own nuxt.config.ts.
  runtimeConfig: {
    public: {
      apiBase: '',
      appName: 'App',
      deployMode: 'development',
      // Canonical public site URL (e.g. https://example.com), no trailing slash.
      // Used by useSeo/useJsonLd for canonical links, OG URLs and schema.org @ids.
      // Empty default = consumers MUST set it (NUXT_PUBLIC_SITE_URL) to get
      // absolute SEO URLs; otherwise canonical/OG fall back to relative paths.
      siteUrl: '',
      // Fallback request timeout in ms for the shared useApi() fetch instance.
      // A safety net against stalled connections (ofetch only builds an
      // AbortController when `timeout` is set — without it a stalled request
      // leaves a promise that never settles). Generous on purpose: it must sit
      // above the slowest legitimate request INCLUDING upload time. Lower it
      // per project (NUXT_PUBLIC_API_TIMEOUT) if you know your profile; raise
      // single calls via the per-call `timeout` option instead of this value.
      apiTimeout: 120000,
      // Tighter limit for DELETE auth/logout only: a stalled logout makes the
      // user believe they are signed out while the session stays open. Clamped
      // to apiTimeout — it can only ever shorten, never lengthen.
      apiLogoutTimeout: 10000,
    },
    apiBaseServer: '',
    // A2 Content-Refresh (opt-in): token that guards server/api/_purge.
    // SERVER-ONLY — never put this under public. Empty default = the purge
    // endpoint is DISABLED (returns 404). A consumer enables A2 by setting
    // NUXT_PURGE_TOKEN (Nuxt maps it to runtimeConfig.purgeToken). See README §A2.
    purgeToken: '',
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
