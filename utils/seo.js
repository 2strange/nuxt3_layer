// Pure SEO/JSON-LD helpers shared by useSeo() and useJsonLd(). Kept in utils/
// (not composables/) so both composables import them explicitly via
// `~/utils/seo` — matching the layer's import convention and avoiding any
// auto-import name collision. All functions are pure: they take the CONFIG
// lookup (from useConfig) as an argument rather than calling composables.

/**
 * Resolve the per-locale SEO/JSON-LD defaults block from app.config (`jsonLD`).
 * Picks the block for `lang`'s base code (e.g. `de-DE` → `de`), the raw lang, or
 * the first defined locale. Always returns an object (empty if unconfigured).
 *
 * @param {(key: string) => any} CONFIG  The CONFIG fn from useConfig().
 * @param {string} [lang]                Active BCP-47 lang or i18n code.
 * @returns {{ defaultTitle?: string, defaultDesc?: string, websiteName?: string,
 *             websiteDesc?: string, organisation?: string, inLanguage?: string,
 *             sameAs?: string[], logo?: { path?: string, width?: number, height?: number, caption?: string } }}
 */
export function seoDefaults(CONFIG, lang) {
  const block = CONFIG('jsonLD')
  if (!block || typeof block !== 'object') return {}
  const base = `${lang || ''}`.split('-')[0]
  return block[base] || block[lang] || block[Object.keys(block)[0]] || {}
}

/**
 * Resolve the site base URL from config, normalized without a trailing slash.
 * Reads `siteUrl` (preferred) then `websiteUrl` (slots-compat).
 *
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
 *
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
 * Convert a BCP-47 tag (`de-DE`) to the underscore form OpenGraph expects (`de_DE`).
 *
 * @param {string} lang
 * @returns {string}
 */
export function ogLocale(lang) {
  return `${lang || 'de-DE'}`.replace('-', '_')
}
