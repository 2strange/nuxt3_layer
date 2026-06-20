// Generic schema.org JSON-LD composable. Injects one or more nodes as a single
// <script type="application/ld+json"> via useHead — zero extra runtime deps,
// SSR-safe. The consumer supplies ALL data; the small builders below only know
// the generic schema.org assembly (@graph wrapping + @id cross-linking), never
// any project- or customer-specific values. NOTHING is hardcoded here.
//
// Generalized from keyhub's jsonLDmixin (Organization / WebSite / WebPage /
// BreadcrumbList / ImageObject + @graph/@id wiring), with every domain value
// turned into a parameter.

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
 * Inject schema.org nodes into the page head as a single ld+json script.
 * Wraps the nodes in `{ "@context": "https://schema.org", "@graph": [...] }`.
 * SSR-safe (runs via useHead on server + client).
 *
 * Pass the output of the builders (`organization`, `website`, `webPage`, …) or
 * any raw node objects. Falsy entries are skipped, so you can conditionally
 * include nodes inline.
 *
 * @param {JsonLdNode | JsonLdNode[]} nodes  One node or an array of nodes.
 * @param {Object} [opts]
 * @param {string} [opts.id]  `key`/dedupe id for the <script>. Default `'ld-json'`.
 *                            Use distinct ids if a layout AND a page both inject.
 * @returns {void}
 *
 * @example
 * const ld = useJsonLd
 * // see useJsonLd's builder helpers below — exposed on the composable + as named exports
 */
export function useJsonLd(nodes, opts = {}) {
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean)
  if (!list.length) return

  const graph = { '@context': SCHEMA_CONTEXT, '@graph': list }

  useHead({
    script: [{
      key: opts.id || 'ld-json',
      type: 'application/ld+json',
      // Serialize ourselves so useHead emits the raw JSON as text content.
      // Escape `<` → `<` so a consumer value containing `</script>`
      // (e.g. a CMS title/caption) can't break out of the script tag. Standard
      // ld+json hardening — escaping `<` keeps the JSON schema.org-valid.
      innerHTML: JSON.stringify(graph).replace(/</g, '\\u003c'),
    }],
  })
}

// Expose the builders on the composable too, so consumers can do
// `const ld = useJsonLd; useJsonLd([ld.organization(...)])` or import them
// individually (they're named exports as well).
useJsonLd.organization = organization
useJsonLd.website = website
useJsonLd.webPage = webPage
useJsonLd.breadcrumbList = breadcrumbList
useJsonLd.imageObject = imageObject

// ---------------------------------------------------------------------------
// Builders — each returns one schema.org node. The consumer fills in their own
// data; cross-node @id wiring (logo↔org, website→publisher, webpage→website…)
// is handled internally so consumers don't fight the @graph.
// ---------------------------------------------------------------------------

/**
 * Build an Organization node (the publisher/provider of the site).
 * Its `@id` is `{siteUrl}#organization` — referenced by `website()` (publisher)
 * and `webPage()` automatically.
 *
 * @param {Object} org
 * @param {string}  org.siteUrl          Site base URL, no trailing slash (the @id anchor).
 * @param {string}  org.name             Legal/display name.
 * @param {string}  [org.type='Organization']  schema.org type (`Organization`, `LocalBusiness`, …).
 * @param {string}  [org.url]            Org homepage (defaults to `{siteUrl}/`).
 * @param {string}  [org.telephone]
 * @param {string}  [org.email]
 * @param {string[]} [org.sameAs]        Profile/related URLs.
 * @param {JsonLdNode} [org.logo]        An `imageObject()` node used as the org logo + image.
 *                                       Cross-linked via its `@id`.
 * @param {Object}  [org.extra]          Extra raw props merged onto the node (e.g. `address`,
 *                                       `areaServed`, `contactPoint`) — fully consumer-defined.
 * @returns {JsonLdNode}
 */
export function organization(org = {}) {
  const { siteUrl = '', name, type = 'Organization', url, telephone, email, sameAs, logo, extra } = org
  const node = pruned({
    '@type': type,
    '@id': `${siteUrl}${ID.organization}`,
    name,
    url: url || `${siteUrl}/`,
    telephone,
    email,
    sameAs: Array.isArray(sameAs) && sameAs.length ? sameAs : undefined,
  })
  if (logo) {
    // Reuse the image node's @id so the graph stays normalized (one ImageObject).
    const logoId = logo['@id'] || `${siteUrl}${ID.logo}`
    node.logo = { '@id': logoId }
    node.image = { '@id': logoId }
  }
  return extra ? { ...node, ...extra } : node
}

/**
 * Build a WebSite node. `@id` = `{siteUrl}#website`; its publisher points at the
 * Organization `@id` automatically when `publisher !== false`.
 *
 * @param {Object} site
 * @param {string}  site.siteUrl         Site base URL, no trailing slash.
 * @param {string}  site.name
 * @param {string}  [site.description]
 * @param {string}  [site.inLanguage]    BCP-47 tag (e.g. `de-DE`).
 * @param {boolean} [site.publisher=true]  Link publisher → Organization `@id`. Set false to omit.
 * @param {Object|string} [site.searchAction]  Optional sitewide SearchAction. Pass a URL-template
 *                                       string to auto-build the standard `potentialAction`, or a
 *                                       full object to use verbatim.
 * @param {Object}  [site.extra]         Extra raw props merged onto the node.
 * @returns {JsonLdNode}
 */
export function website(site = {}) {
  const { siteUrl = '', name, description, inLanguage, publisher = true, searchAction, extra } = site
  const node = pruned({
    '@type': 'WebSite',
    '@id': `${siteUrl}${ID.website}`,
    url: `${siteUrl}/`,
    name,
    description,
    inLanguage,
    publisher: publisher ? { '@id': `${siteUrl}${ID.organization}` } : undefined,
  })
  if (searchAction) {
    node.potentialAction = typeof searchAction === 'string'
      ? {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: searchAction },
          'query-input': 'required name=search_term_string',
        }
      : searchAction
  }
  return extra ? { ...node, ...extra } : node
}

/**
 * Build a WebPage node for the current page, wired into the website + (optional)
 * breadcrumb + primary image by `@id`.
 *
 * @param {Object} page
 * @param {string}  page.siteUrl         Site base URL, no trailing slash (for website `@id` link).
 * @param {string}  page.url             Absolute URL of THIS page (the @id anchor).
 * @param {string}  [page.name]
 * @param {string}  [page.description]
 * @param {string}  [page.inLanguage]
 * @param {string}  [page.datePublished] ISO 8601.
 * @param {string}  [page.dateModified]  ISO 8601.
 * @param {boolean} [page.isPartOf=true] Link `isPartOf` → website `@id`. Set false to omit.
 * @param {boolean|JsonLdNode} [page.breadcrumb]  `true` to reference `{url}#breadcrumb` (pair with a
 *                                       `breadcrumbList()` node in the same graph), or pass the
 *                                       breadcrumb node itself to link by its `@id`.
 * @param {boolean|JsonLdNode} [page.primaryImage]  `true` to reference `{url}#primaryimage`, or pass
 *                                       an `imageObject()` node to link by its `@id`.
 * @param {Object}  [page.extra]         Extra raw props merged onto the node.
 * @returns {JsonLdNode}
 */
export function webPage(page = {}) {
  const {
    siteUrl = '', url = '', name, description, inLanguage,
    datePublished, dateModified, isPartOf = true, breadcrumb, primaryImage, extra,
  } = page
  const node = pruned({
    '@type': 'WebPage',
    '@id': ID.webpage(url),
    url,
    name,
    headline: name,
    description,
    inLanguage,
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
 * @param {string} [img.inLanguage]
 * @returns {JsonLdNode}
 */
export function imageObject(img = {}) {
  const { url, id, width, height, caption, inLanguage } = img
  return pruned({
    '@type': 'ImageObject',
    '@id': id,
    url,
    contentUrl: url,
    width,
    height,
    caption,
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
