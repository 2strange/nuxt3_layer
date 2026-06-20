// Generic SEO-head composable. Sets <title>, meta description, canonical and
// the full OpenGraph/Twitter tag set via Nuxt's useHead + useSeoMeta — zero
// extra runtime deps. ALL data flows in from the consumer: per-call `opts`, the
// layer's `jsonLD` config defaults (app.config, per locale), `company.*` and
// runtimeConfig (`appName`, `siteUrl`). NOTHING project-specific is hardcoded.
//
// Philosophy (Austin's OG-unfurl lesson): a COMPLETE OG card + STRONG defaults +
// per-content dynamics beat "elegant" minimalism. So even a page that passes no
// data gets a full card from the jsonLD defaults block; pages override per-field.
//
// REACTIVE: `opts` values may be refs/getters/computed — they're read inside the
// reactive useHead/useSeoMeta callbacks, so the head follows async content
// (e.g. an article page whose data loads after mount). Do NOT snapshot.
//
// Derived from slots_frontend's useSeo (title + lang + OG) and the generic
// OG/article assembly + defaults discipline in keyhub's jsonLDmixin / hof's
// config-driven app.config['jsonLD'][locale], parameterized for the layer.

import { computed, unref } from 'vue'
import { seoDefaults, resolveSiteUrl, absoluteUrl, ogLocale } from '~/utils/seo'

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
 * Every field may be a plain value OR a ref/computed/getter — read reactively.
 * @property {string}  [title]           Page title. Combined with the app name as
 *                                       `"{title} | {appName}"` unless `titleTemplate` is given.
 *                                       Falls back to `jsonLD[locale].defaultTitle`.
 * @property {string}  [description]     Meta + og:description. Falls back to `jsonLD[locale].defaultDesc`.
 * @property {string|false} [titleTemplate]  Override the `"%s | {appName}"` template. Pass a string
 *                                       with `%s` as the title placeholder, or `false` for the bare title.
 * @property {string}  [canonical]       Canonical URL. Defaults to `{siteUrl}{route.path}`.
 * @property {string}  [ogType]          OpenGraph type. Default `'website'`, or `'article'` when
 *                                       `datePublished`/`dateModified` is set.
 * @property {SeoImage|string} [image]   OG/Twitter image. A bare string is treated as `{ url }`.
 *                                       Falls back to the default OG image (jsonLD.logo / company.ogImage).
 * @property {string}  [twitterCard]     Twitter card type (default `'summary_large_image'`).
 * @property {string}  [lang]            BCP-47 lang for <html lang> + og:locale. Defaults to
 *                                       `jsonLD[locale].inLanguage`, then the i18n locale, then `'de-DE'`.
 * @property {string}  [datePublished]   ISO 8601 → article:published_time (and forces og:type=article).
 * @property {string}  [dateModified]    ISO 8601 → article:modified_time.
 * @property {string}  [publisher]       article:publisher. Falls back to `jsonLD[locale].organisation`.
 * @property {boolean} [noindex]         When true, emits `<meta name="robots" content="noindex,nofollow">`.
 */

/**
 * Apply SEO head tags (title, description, canonical, full OG + Twitter, html
 * lang, article:* ) for the current page. Call once from a page's `<script setup>`
 * (or a layout, for sitewide defaults). Reactive: pass refs/getters for fields
 * that load async.
 *
 * Data sources (consumer-provided, nothing hardcoded), in priority order:
 *  1. `opts` (per-call)
 *  2. `jsonLD[locale]` defaults block (app.config) — defaultTitle/defaultDesc/logo/organisation/inLanguage
 *  3. `runtimeConfig.public.appName` / `siteUrl`, `company.*`
 *
 * SSR-safe.
 *
 * @param {SeoOptions} [opts={}]
 * @returns {{ siteUrl: import('vue').ComputedRef<string>,
 *             title: import('vue').ComputedRef<string>,
 *             description: import('vue').ComputedRef<string>,
 *             canonical: import('vue').ComputedRef<string>,
 *             lang: import('vue').ComputedRef<string> }}
 *          Reactive resolved values (handy for tests / feeding useJsonLd).
 *
 * @example
 * // Static page — full card from defaults + page title:
 * useSeo({ title: 'Über uns', description: 'Wer wir sind.' })
 *
 * @example
 * // Dynamic article — reactive opts follow the async-loaded data:
 * const { data: article } = await useFetch(`/api/articles/${slug}`)
 * useSeo({
 *   title:       () => article.value?.title,
 *   description: () => article.value?.excerpt,
 *   image:       () => article.value?.ogImage,
 *   datePublished: () => article.value?.publishedAt,   // → og:type=article + article:published_time
 *   dateModified:  () => article.value?.updatedAt,
 * })
 */
export function useSeo(opts = {}) {
  const route = useRoute()
  const { CONFIG } = useConfig()

  // read(field): unwraps refs and calls getter-functions, so opts stay reactive.
  const read = (v) => (typeof v === 'function' ? v() : unref(v))

  const siteUrl = computed(() => resolveSiteUrl(CONFIG))
  const appName = computed(() => CONFIG('appName') || CONFIG('company.name') || '')
  const lang = computed(() => read(opts.lang) || resolveLang(CONFIG))
  const def = computed(() => seoDefaults(CONFIG, lang.value))

  const title = computed(() => {
    const t = read(opts.title) || def.value.defaultTitle || ''
    const tpl = read(opts.titleTemplate)
    if (tpl === false) return t || appName.value
    if (typeof tpl === 'string') return t ? tpl.replace('%s', t) : appName.value
    return t && appName.value && t !== appName.value ? `${t} | ${appName.value}` : (t || appName.value)
  })

  const description = computed(() => read(opts.description) || def.value.defaultDesc || '')
  const canonical = computed(() => absoluteUrl(read(opts.canonical) || `${route.path}`, siteUrl.value))

  const datePublished = computed(() => read(opts.datePublished) || undefined)
  const dateModified = computed(() => read(opts.dateModified) || undefined)
  const isArticle = computed(() => read(opts.ogType) === 'article' || !!datePublished.value)
  const ogType = computed(() => read(opts.ogType) || (isArticle.value ? 'article' : 'website'))
  const publisher = computed(() => read(opts.publisher) || def.value.organisation || undefined)

  const image = computed(() => {
    const raw = read(opts.image)
    const img = typeof raw === 'string' ? { url: raw } : raw
    if (img?.url) return { ...img, url: absoluteUrl(img.url, siteUrl.value) }
    // Default OG image: explicit company.ogImage, else the org logo, else /og-default.png.
    const fallback = CONFIG('company.ogImage') || def.value.logo?.path || '/og-default.png'
    const url = absoluteUrl(fallback, siteUrl.value)
    return url ? { url, width: def.value.logo?.width || undefined, height: def.value.logo?.height || undefined } : undefined
  })

  useHead(() => ({
    htmlAttrs: { lang: lang.value },
    link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [],
    meta: read(opts.noindex) ? [{ name: 'robots', content: 'noindex,nofollow' }] : [],
  }))

  // useSeoMeta dedupes by key and drops undefined entries, so unset fields emit nothing.
  useSeoMeta(() => {
    const img = image.value
    const desc = description.value || undefined
    return {
      title: title.value,
      description: desc,
      ogType: ogType.value,
      ogTitle: title.value,
      ogDescription: desc,
      ogUrl: canonical.value || undefined,
      ogSiteName: appName.value || undefined,
      ogLocale: ogLocale(lang.value),
      ogImage: img?.url,
      ogImageWidth: img?.width,
      ogImageHeight: img?.height,
      ogImageAlt: img?.alt,
      ogImageType: img?.type,
      twitterCard: read(opts.twitterCard) || 'summary_large_image',
      twitterTitle: title.value,
      twitterDescription: desc,
      twitterImage: img?.url,
      // article:* — only when this is an article (datePublished or ogType==='article').
      articlePublishedTime: isArticle.value ? datePublished.value : undefined,
      articleModifiedTime: isArticle.value ? dateModified.value : undefined,
      articlePublisher: isArticle.value ? publisher.value : undefined,
    }
  })

  return { siteUrl, title, description, canonical, lang }
}

/**
 * Resolve the active language as a BCP-47 tag: jsonLD[locale].inLanguage wins,
 * then the i18n locale (mapped), else `'de-DE'`. Safe when i18n is absent.
 * @param {(key: string) => any} CONFIG
 * @returns {string}
 */
function resolveLang(CONFIG) {
  let code
  try {
    code = useNuxtApp().$i18n?.locale?.value
  } catch {
    code = undefined
  }
  const fromConfig = seoDefaults(CONFIG, code).inLanguage
  if (fromConfig) return fromConfig
  const map = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', it: 'it-IT' }
  return map[code] || 'de-DE'
}
