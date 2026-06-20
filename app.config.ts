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
    // Default OpenGraph image (root-relative path like `/og-default.png`, or an
    // absolute URL). Used by useSeo as the og:image fallback when a page passes
    // none AND jsonLD[locale].logo.path is empty. Empty = no default image.
    ogImage: '',
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
  // Name of the cookie-consent cookie (read/written by useAppStore).
  // Default = historical hardcoded value, so existing apps keep recognizing
  // already-set consent cookies without any config (zero-config drop-in).
  cookiesAcceptedKey: 'slBkngCookiesOK',

  // SEO / JSON-LD defaults — read by useSeo() + useJsonLd() so EVERY page gets a
  // full OG card + a complete schema.org @graph even with zero per-page data.
  // Keyed PER LOCALE (the active i18n code, e.g. `de`/`en`); useSeo/useJsonLd
  // pick the matching block, falling back to the first defined locale. All
  // values here are NEUTRAL placeholders — consuming projects override the whole
  // block (or single keys/locales) via their own app.config.ts. Nothing brand-
  // specific belongs in the layer.
  //
  // Per-locale shape:
  //   defaultTitle  — fallback <title> / og:title when a page passes none
  //   defaultDesc   — fallback (og:)description
  //   websiteName   — schema.org WebSite.name
  //   websiteDesc   — schema.org WebSite.description
  //   organisation  — schema.org Organization.name (also article:publisher)
  //   inLanguage    — BCP-47 tag for the WebSite/WebPage/OG locale
  //   sameAs        — Organization.sameAs profile URLs
  //   logo          — { path, width, height, caption } for the Organization logo
  //                    ImageObject; `path` is root-relative (prefixed with siteUrl)
  //                    or absolute. Doubles as the default og:image.
  jsonLD: {
    de: {
      defaultTitle: '',
      defaultDesc: '',
      websiteName: '',
      websiteDesc: '',
      organisation: '',
      inLanguage: 'de-DE',
      sameAs: [] as string[],
      logo: { path: '', width: 0, height: 0, caption: '' },
    },
    en: {
      defaultTitle: '',
      defaultDesc: '',
      websiteName: '',
      websiteDesc: '',
      organisation: '',
      inLanguage: 'en-US',
      sameAs: [] as string[],
      logo: { path: '', width: 0, height: 0, caption: '' },
    },
  },
})
