// Defaults that consuming projects can override by providing their own
// `app.config.ts` at their project root. Nuxt deep-merges these.
//
// Use this for STATIC, build-time, non-secret values. For URLs and
// environment-specific values use `runtimeConfig` in nuxt.config.ts instead.
export default defineAppConfig({
  company: {
    name: '',
    legal: '',
    short: '',
    street: '',
    zipcode: '',
    city: '',
    fon: '',
    mail: '',
  },
  mails: {
    contact: '',
    support: '',
    legal: '',
    customerservice: '',
  },
  locales: {
    de: 'Deutsch',
    en: 'English',
  },
  cookiesAcceptedKey: 'app_cookies_ok',
})
