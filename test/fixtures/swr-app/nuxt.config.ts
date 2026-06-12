// G15 verification fixture — a minimal Nuxt app that `extends` the layer so the
// REAL server/api/_purge.post.ts endpoint is included, plus one swr-cached
// content route to prove the purge actually invalidates the cache.
//
// This fixture is intentionally lean: it does NOT pull in the layer's Vuetify/
// i18n/Pinia front-end stack (we only verify the Nitro purge mechanic + the
// endpoint), so it overrides modules/css to empty. It still extends the layer
// to pick up server/.
// G15 verification fixture.
//
// We deliberately do NOT `extends` the full layer here: Nuxt MERGES layer
// arrays (css/modules) rather than replacing them, so extending would drag in
// the whole Vuetify/i18n/Pinia front-end stack (and its `~/assets/...` paths)
// just to test a plain Nitro endpoint. Instead, the layer's real
// server/api/_purge.post.ts is symlinked into this fixture's server/api/ by
// run-purge-verify.sh, so we test the ACTUAL endpoint source byte-for-byte,
// in isolation, with a fast server-only build.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  runtimeConfig: {
    // Set by the smoke-test runner via NUXT_PURGE_TOKEN env var at runtime.
    purgeToken: '',
  },

  // Mark the swr content route as stale-while-revalidate with a short TTL.
  // maxAge: how long a render is considered fresh; staleMaxAge: how long a stale
  // render may still be served while revalidating. With purge we don't wait for
  // either — we clear the cache explicitly.
  routeRules: {
    '/swr-content': { swr: 60 },
  },

  nitro: {
    // Default memory storage for the cache mount (what production uses unless
    // overridden). The purge clears the `nitro` prefix inside this mount.
  },
})
