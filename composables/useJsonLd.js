// Generic schema.org JSON-LD composable. Injects one or more nodes as a single
// <script type="application/ld+json"> via useHead — zero extra runtime deps,
// SSR-safe. The consumer supplies the data; the builders below know only the
// generic schema.org assembly (@graph wrapping + @id cross-linking) and read
// NEUTRAL defaults from the layer's `jsonLD` app.config block. NOTHING project-
// or customer-specific is hardcoded here.
//
// REACTIVE: useJsonLd accepts a plain node/array OR a getter/ref/computed of one
// — read inside a reactive useHead callback, so the graph follows async content
// (e.g. an article page whose data loads after mount).
//
// CONFIG-DRIVEN: organization()/website() with no/partial args fill from the
// per-locale `jsonLD` defaults (app.config) — so zero-per-page still yields a
// full @graph. Generalized from keyhub's jsonLDmixin (@graph/@id assembly) +
// hof's config-driven app.config['jsonLD'][locale], with every domain value
// turned into a parameter or a neutral config default.

import { unref } from 'vue'
import { resolveSiteUrl, seoDefaults, absoluteUrl } from '~/utils/seo'

const SCHEMA_CONTEXT = 'https://schema.org'

// Stable @id fragments so nodes can reference each other within one @graph
// without the consumer wiring ids by hand. Combined with the site URL these
// become e.g. `https://example.com/#organization`.
const ID = {
  organization: '#organization',
  website: '#website',
  logo: '#logo',
  webpage: (url) => `${url}#webpage`,
  breadcrumb: (url) => `${url}#breadcrumb`,
  primaryImage: (url) => `${url}#primaryimage`,
}

/**
 * @typedef {Object} JsonLdNode A schema.org node (e.g. the return of `organization()`).
 *   Already includes `@type` and (where relevant) `@id`. The `@context` is added
 *   once at the graph level, so individual builder outputs omit it.
 */

/**
 * Inject schema.org nodes into the page head as a single ld+json script,
 * wrapped in `{ "@context": "https://schema.org", "@graph": [...] }`. Falsy
 * entries are skipped (so you can include nodes conditionally). SSR-safe.
 *
 * @param {JsonLdNode | JsonLdNode[] | (() => JsonLdNode|JsonLdNode[]) | import('vue').Ref} nodes
 *        A node, an array of nodes, OR a getter/ref/computed returning either —
 *        the reactive form re-renders the script when the source changes.
 * @param {Object} [opts]
 * @param {string} [opts.id]  `key`/dedupe id for the <script>. Default `'ld-json'`.
 *                            Use distinct ids if a layout AND a page both inject.
 * @returns {void}
 *
 * @example
 * // Static graph (helpers are on the composable + named exports):
 * useJsonLd([
 *   useJsonLd.organization(),   // no args → from jsonLD config block
 *   useJsonLd.website(),
 * ])
 *
 * @example
 * // Reactive graph following async article data:
 * useJsonLd(() => {
 *   const a = article.value
 *   if (!a) return []
 *   const url = `${siteUrl.value}${useRoute().path}`
 *   return [useJsonLd.webPage({ url, name: a.title, datePublished: a.publishedAt })]
 * })
 */
export function useJsonLd(nodes, opts = {}) {
  // Reactive when given a function/ref; otherwise a one-shot resolve each render.
  const resolve = () => {
    const raw = typeof nodes === 'function' ? nodes() : unref(nodes)
    const list = (Array.isArray(raw) ? raw : [raw]).filter(Boolean)
    return list.length
      ? JSON.stringify({ '@context': SCHEMA_CONTEXT, '@graph': list })
      : ''
  }

  useHead(() => {
    const json = resolve()
    if (!json) return {}
    return {
      script: [{
        key: opts.id || 'ld-json',
        type: 'application/ld+json',
        // Escape `<` → `<` so a consumer value containing `</script>`
        // (e.g. a CMS title/caption) can't break out of the script tag. Standard
        // ld+json hardening — escaping `<` keeps the JSON schema.org-valid.
        innerHTML: json.replace(/</g, '\\u003c'),
      }],
    }
  })
}

// Expose the builders on the composable too, so consumers can do
// `useJsonLd([useJsonLd.organization(), …])` or import them individually
// (they're named exports as well).
useJsonLd.organization = organization
useJsonLd.website = website
useJsonLd.webPage = webPage
useJsonLd.breadcrumbList = breadcrumbList
useJsonLd.imageObject = imageObject

// ---------------------------------------------------------------------------
// Builders — each returns one schema.org node. Cross-node @id wiring (logo↔org,
// website→publisher, webpage→website…) is handled internally. organization()/
// website() fill missing fields from the per-locale `jsonLD` app.config block.
// ---------------------------------------------------------------------------

/**
 * Build an Organization node (the publisher/provider of the site). `@id` =
 * `{siteUrl}#organization`, referenced by `website()` and `webPage()`.
 *
 * Called with NO/partial args, it fills from the `jsonLD[locale]` config block:
 * `siteUrl` from runtimeConfig, `name` from `organisation`, and a logo
 * ImageObject from `logo.{path,width,height,caption}`. Also pulls `company.fon`/
 * `company.mail` for phone/email when not given.
 *
 * @param {Object} [org]
 * @param {string}  [org.siteUrl]        Site base URL, no trailing slash (the @id anchor).
 * @param {string}  [org.name]           Legal/display name (default `jsonLD.organisation`).
 * @param {string}  [org.type='Organization']  schema.org type (`Organization`, `LocalBusiness`, …).
 * @param {string}  [org.url]            Org homepage (defaults to `{siteUrl}/`).
 * @param {string}  [org.telephone]      Default `company.fon`.
 * @param {string}  [org.email]          Default `company.mail`.
 * @param {string[]} [org.sameAs]        Profile/related URLs (default `jsonLD.sameAs`).
 * @param {JsonLdNode|false} [org.logo]  An `imageObject()` node used as logo + image (cross-linked
 *                                       by @id). Omit to auto-build from `jsonLD.logo`; pass `false`
 *                                       to suppress.
 * @param {string}  [org.lang]           Locale override for the defaults block (else active i18n).
 * @param {Object}  [org.extra]          Extra raw props merged onto the node (e.g. `address`,
 *                                       `areaServed`, `contactPoint`, `makesOffer`) — consumer-defined.
 * @returns {JsonLdNode}
 */
export function organization(org = {}) {
  const { CONFIG } = useConfig()
  const siteUrl = org.siteUrl ?? resolveSiteUrl(CONFIG)
  const d = seoDefaults(CONFIG, org.lang)
  const name = org.name ?? (d.organisation || CONFIG('company.legal') || CONFIG('company.name') || CONFIG('appName'))

  const node = pruned({
    '@type': org.type || 'Organization',
    '@id': `${siteUrl}${ID.organization}`,
    name,
    url: org.url || `${siteUrl}/`,
    telephone: org.telephone ?? (CONFIG('company.fon') || undefined),
    email: org.email ?? (CONFIG('company.mail') || undefined),
    sameAs: pickArray(org.sameAs ?? d.sameAs),
  })

  // logo: explicit node, false=suppress, or auto-built from jsonLD.logo config.
  let logo = org.logo
  if (logo === undefined && d.logo?.path) {
    logo = imageObject({
      id: `${siteUrl}${ID.logo}`,
      url: absoluteUrl(d.logo.path, siteUrl),
      width: d.logo.width || undefined,
      height: d.logo.height || undefined,
      caption: d.logo.caption || name,
    })
  }
  if (logo) {
    const logoId = logo['@id'] || `${siteUrl}${ID.logo}`
    node.logo = { '@id': logoId }
    node.image = { '@id': logoId }
  }
  return org.extra ? { ...node, ...org.extra } : node
}

/**
 * Build a WebSite node. `@id` = `{siteUrl}#website`; publisher → Organization
 * `@id` automatically. Fills name/description/inLanguage from `jsonLD[locale]`.
 *
 * @param {Object} [site]
 * @param {string}  [site.siteUrl]       Site base URL, no trailing slash.
 * @param {string}  [site.name]          Default `jsonLD.websiteName` → appName.
 * @param {string}  [site.description]   Default `jsonLD.websiteDesc`.
 * @param {string}  [site.inLanguage]    BCP-47 tag (default `jsonLD.inLanguage`).
 * @param {boolean} [site.publisher=true]  Link publisher → Organization `@id`. Set false to omit.
 * @param {Object|string} [site.searchAction]  Optional sitewide SearchAction. Pass a URL-template
 *                                       string to auto-build the standard `potentialAction`, or a
 *                                       full object to use verbatim.
 * @param {string}  [site.lang]          Locale override for the defaults block.
 * @param {Object}  [site.extra]         Extra raw props merged onto the node.
 * @returns {JsonLdNode}
 */
export function website(site = {}) {
  const { CONFIG } = useConfig()
  const siteUrl = site.siteUrl ?? resolveSiteUrl(CONFIG)
  const d = seoDefaults(CONFIG, site.lang)
  const publisher = site.publisher !== false

  const node = pruned({
    '@type': 'WebSite',
    '@id': `${siteUrl}${ID.website}`,
    url: `${siteUrl}/`,
    name: site.name ?? (d.websiteName || CONFIG('appName')),
    description: site.description ?? (d.websiteDesc || undefined),
    inLanguage: site.inLanguage ?? (d.inLanguage || undefined),
    publisher: publisher ? { '@id': `${siteUrl}${ID.organization}` } : undefined,
  })
  const sa = site.searchAction
  if (sa) {
    node.potentialAction = typeof sa === 'string'
      ? {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: sa },
          'query-input': 'required name=search_term_string',
        }
      : sa
  }
  return site.extra ? { ...node, ...site.extra } : node
}

/**
 * Build a WebPage node for the current page, wired into the website + (optional)
 * breadcrumb + primary image by `@id`.
 *
 * @param {Object} page
 * @param {string}  [page.siteUrl]       Site base URL (for website `@id` link; default from config).
 * @param {string}  page.url             Absolute URL of THIS page (the @id anchor).
 * @param {string}  [page.name]
 * @param {string}  [page.description]
 * @param {string}  [page.inLanguage]    Default `jsonLD.inLanguage`.
 * @param {string}  [page.datePublished] ISO 8601.
 * @param {string}  [page.dateModified]  ISO 8601.
 * @param {boolean} [page.isPartOf=true] Link `isPartOf` → website `@id`. Set false to omit.
 * @param {boolean|JsonLdNode} [page.breadcrumb]  `true` → reference `{url}#breadcrumb` (pair with a
 *                                       `breadcrumbList()` node), or pass the node to link by its `@id`.
 * @param {boolean|JsonLdNode} [page.primaryImage]  `true` → reference `{url}#primaryimage`, or pass
 *                                       an `imageObject()` node to link by its `@id`.
 * @param {string}  [page.lang]          Locale override for the defaults block.
 * @param {Object}  [page.extra]         Extra raw props merged onto the node.
 * @returns {JsonLdNode}
 */
export function webPage(page = {}) {
  const { CONFIG } = useConfig()
  const siteUrl = page.siteUrl ?? resolveSiteUrl(CONFIG)
  const d = seoDefaults(CONFIG, page.lang)
  const { url = '', name, description, datePublished, dateModified, isPartOf = true, breadcrumb, primaryImage, extra } = page

  const node = pruned({
    '@type': 'WebPage',
    '@id': ID.webpage(url),
    url,
    name,
    headline: name,
    description,
    inLanguage: page.inLanguage ?? (d.inLanguage || undefined),
    datePublished,
    dateModified,
    isPartOf: isPartOf ? { '@id': `${siteUrl}${ID.website}` } : undefined,
  })
  if (breadcrumb) {
    node.breadcrumb = { '@id': breadcrumb === true ? ID.breadcrumb(url) : (breadcrumb['@id'] || ID.breadcrumb(url)) }
  }
  if (primaryImage) {
    node.primaryImageOfPage = { '@id': primaryImage === true ? ID.primaryImage(url) : (primaryImage['@id'] || ID.primaryImage(url)) }
  }
  return extra ? { ...node, ...extra } : node
}

/**
 * Build a BreadcrumbList node from an ordered list of trail items.
 * `@id` = `{pageUrl}#breadcrumb` so a `webPage({ breadcrumb: true })` links to it.
 *
 * @param {Object} crumbs
 * @param {string}  crumbs.pageUrl       Absolute URL of the page (the @id anchor).
 * @param {Array<{ name: string, item?: string }>} crumbs.items  Trail, top→current. The last item's
 *                                       `item` (URL) is optional (current page).
 * @returns {JsonLdNode}
 *
 * @example
 * breadcrumbList({ pageUrl, items: [
 *   { name: 'Home', item: `${siteUrl}/` },
 *   { name: 'Blog', item: `${siteUrl}/blog` },
 *   { name: post.title },              // current page — no item
 * ]})
 */
export function breadcrumbList(crumbs = {}) {
  const { pageUrl = '', items = [] } = crumbs
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(pageUrl),
    itemListElement: items.map((it, i) => pruned({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  }
}

/**
 * Build an ImageObject node. Used as an org logo or a page's primary image; the
 * `@id` lets other nodes reference it instead of duplicating the data.
 *
 * @param {Object} img
 * @param {string}  img.url              Absolute image URL (also used as `contentUrl`).
 * @param {string}  img.id               Full `@id` for the node, e.g. `${siteUrl}#logo`
 *                                       or `${pageUrl}#primaryimage`. Required for cross-linking.
 * @param {number} [img.width]
 * @param {number} [img.height]
 * @param {string} [img.caption]
 * @param {string} [img.thumbnailUrl]    Optional smaller preview URL (schema.org `thumbnailUrl`).
 * @param {string} [img.inLanguage]
 * @returns {JsonLdNode}
 */
export function imageObject(img = {}) {
  const { url, id, width, height, caption, thumbnailUrl, inLanguage } = img
  return pruned({
    '@type': 'ImageObject',
    '@id': id,
    url,
    contentUrl: url,
    width,
    height,
    caption,
    thumbnailUrl,
    inLanguage,
  })
}

// Drop keys whose value is undefined/null/'' so the emitted JSON-LD stays lean
// and we never ship empty strings for unset consumer fields.
function pruned(obj) {
  const out = {}
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined && v !== null && v !== '') out[k] = v
  }
  return out
}

// Return the array only if it has entries, else undefined (so pruned() drops it).
function pickArray(a) {
  return Array.isArray(a) && a.length ? a : undefined
}
