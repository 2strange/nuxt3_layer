// Generic SEO-head composable. Sets <title>, meta description, canonical and
// the OpenGraph/Twitter tags via Nuxt's useHead + useSeoMeta — zero extra
// runtime deps. ALL data flows in from the consumer: the per-call `opts`, the
// layer's app.config (`company.*`) and runtimeConfig (`public.appName`,
// `public.siteUrl`). NOTHING project-specific is hardcoded here.
//
// Derived from slots_frontend's useSeo (title + lang + OG) and the generic
// OG/Twitter assembly in keyhub's jsonLDmixin, parameterized for the layer.

/**
 * @typedef {Object} SeoImage
 * @property {string}  url               Absolute or root-relative image URL. Root-relative paths
 *                                       (`/og.png`) are prefixed with the resolved site URL.
 * @property {number} [width]            Image width in px (og:image:width).
 * @property {number} [height]           Image height in px (og:image:height).
 * @property {string} [alt]              Alt text (og:image:alt).
 * @property {string} [type]             MIME type, e.g. `image/png` (og:image:type).
 */

/**
 * @typedef {Object} SeoOptions
 * @property {string}  [title]           Page title. Combined with the app name as
 *                                       `"{title} | {appName}"` unless `titleTemplate` is given.
 * @property {string}  [description]     Meta + og:description.
 * @property {string|false} [titleTemplate]  Override the `"%s | {appName}"` template. Pass a string
 *                                       with `%s` as the title placeholder, or `false` to use the
 *                                       bare title with no app-name suffix.
 * @property {string}  [canonical]       Canonical URL. Defaults to `{siteUrl}{route.path}`. Pass
 *                                       an absolute URL or a root-relative path.
 * @property {string}  [ogType]          OpenGraph type (default `'website'`).
 * @property {SeoImage|string} [image]   OG/Twitter image. A bare string is treated as `{ url }`.
 * @property {string}  [twitterCard]     Twitter card type (default `'summary_large_image'`).
 * @property {string}  [lang]            BCP-47 lang for <html lang> + og:locale. Defaults to the
 *                                       active i18n locale (mapped via `localeMap`), else `'de-DE'`.
 * @property {Object<string,string>} [localeMap]  Override the i18n-code → BCP-47 map
 *                                       (default `{ de:'de-DE', en:'en-US' }`).
 * @property {boolean} [noindex]         When true, emits `<meta name="robots" content="noindex,nofollow">`.
 */

/**
 * Apply SEO head tags (title, description, canonical, OG, Twitter, html lang)
 * for the current page. Call once from a page's `<script setup>`.
 *
 * Data sources (consumer-provided, nothing hardcoded):
 *  - `opts`                     — per-call overrides (title/description/image/…)
 *  - `runtimeConfig.public.appName`  — title-template suffix + og:site_name
 *  - `runtimeConfig.public.siteUrl`  — base URL for canonical + root-relative images
 *  - active i18n locale         — <html lang> + og:locale
 *
 * SSR-safe: useHead/useSeoMeta run on both server and client.
 *
 * @param {SeoOptions} [opts={}]
 * @returns {{ title: string, description: string, canonical: string, lang: string, siteUrl: string }}
 *          The resolved values (handy for tests / passing into useJsonLd).
 *
 * @example
 * // pages/about.vue
 * <script setup>
 * useSeo({ title: 'Über uns', description: 'Wer wir sind.' })
 * </script>
 *
 * @example
 * // With an OG image pulled from app.config / a CMS field:
 * const { appConfig } = useConfig()
 * useSeo({
 *   title: page.title,
 *   description: page.excerpt,
 *   image: { url: page.ogImage, width: 1200, height: 630, alt: page.title },
 * })
 */
export function useSeo(opts = {}) {
  const route = useRoute()
  const { CONFIG } = useConfig()

  const siteUrl = resolveSiteUrl(CONFIG)
  const appName = CONFIG('appName') || CONFIG('company.name') || ''
  const lang = opts.lang || resolveLang(opts.localeMap)

  // Title: explicit template wins; `false` = bare title; else "{title} | {appName}".
  let title
  if (opts.titleTemplate === false) {
    title = opts.title || appName
  } else if (typeof opts.titleTemplate === 'string') {
    title = opts.title ? opts.titleTemplate.replace('%s', opts.title) : appName
  } else {
    title = opts.title && appName ? `${opts.title} | ${appName}` : (opts.title || appName)
  }

  const description = opts.description || ''
  const canonical = absoluteUrl(opts.canonical || `${route.path}`, siteUrl)
  const ogType = opts.ogType || 'website'
  const twitterCard = opts.twitterCard || 'summary_large_image'

  const img = typeof opts.image === 'string' ? { url: opts.image } : opts.image
  const imageUrl = img?.url ? absoluteUrl(img.url, siteUrl) : undefined

  useHead({
    htmlAttrs: { lang },
    link: canonical ? [{ rel: 'canonical', href: canonical }] : [],
    meta: opts.noindex ? [{ name: 'robots', content: 'noindex,nofollow' }] : [],
  })

  // useSeoMeta dedupes by key and drops undefined entries, so unset fields emit nothing.
  useSeoMeta({
    title,
    description: description || undefined,
    ogType,
    ogTitle: title,
    ogDescription: description || undefined,
    ogUrl: canonical || undefined,
    ogSiteName: appName || undefined,
    ogLocale: ogLocale(lang),
    ogImage: imageUrl,
    ogImageWidth: img?.width,
    ogImageHeight: img?.height,
    ogImageAlt: img?.alt,
    ogImageType: img?.type,
    twitterCard,
    twitterTitle: title,
    twitterDescription: description || undefined,
    twitterImage: imageUrl,
  })

  return { title, description, canonical, lang, siteUrl }
}

/**
 * Resolve the site base URL from config, normalized without a trailing slash.
 * Reads `siteUrl` (preferred) then `websiteUrl` (slots-compat) from
 * runtimeConfig.public / app.config via the passed CONFIG lookup.
 * @param {(key: string) => any} CONFIG  The CONFIG fn from useConfig().
 * @returns {string} e.g. `'https://example.com'`, or `''` if unconfigured.
 */
export function resolveSiteUrl(CONFIG) {
  const raw = CONFIG('siteUrl') || CONFIG('websiteUrl') || ''
  return `${raw}`.replace(/\/+$/, '')
}

/**
 * Turn a possibly-relative URL into an absolute one using the site base URL.
 * Absolute inputs (`http(s)://…`) are returned unchanged.
 * @param {string} url
 * @param {string} siteUrl  Base URL without trailing slash.
 * @returns {string}
 */
export function absoluteUrl(url, siteUrl) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return `${siteUrl}${path}`
}

/**
 * Map the active i18n locale code to a BCP-47 tag. Falls back to `'de-DE'`.
 * Safe to call when @nuxtjs/i18n is absent (returns the fallback).
 * @param {Object<string,string>} [localeMap]
 * @returns {string}
 */
function resolveLang(localeMap) {
  const map = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', it: 'it-IT', ...(localeMap || {}) }
  let code
  try {
    code = useNuxtApp().$i18n?.locale?.value
  } catch {
    code = undefined
  }
  return map[code] || 'de-DE'
}

/**
 * Convert a BCP-47 tag (`de-DE`) to the underscore form OG expects (`de_DE`).
 * @param {string} lang
 * @returns {string}
 */
function ogLocale(lang) {
  return `${lang || 'de-DE'}`.replace('-', '_')
}
