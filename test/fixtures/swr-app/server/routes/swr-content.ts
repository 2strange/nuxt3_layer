// An swr-cached content route for the G15 purge verification.
//
// It returns a per-render marker (an ISO timestamp + a random nonce) generated
// at REAL render time. Because routeRules marks this route `swr`, repeated
// requests are served from Nitro's cache and return the SAME marker — until the
// cache is purged, after which the next request re-renders and the marker
// changes. The smoke-test compares the marker before/after purge.
export default defineEventHandler(() => {
  const renderedAt = new Date().toISOString()
  const nonce = Math.random().toString(36).slice(2, 10)
  // Plain-text body so a regex can pull the marker out trivially.
  return `RENDERED_AT=${renderedAt} NONCE=${nonce}\n`
})
