// server/api/_purge.post.ts — A2 Content-Refresh: on-demand Nitro routeRules cache purge.
//
// Part of the A2 "Content-Refresh" contract (see capistrano-recipes4nuxt
// docs/migration-nuxt2-to-nuxt3-ssr.md §10 + PURGE_SMOKE_TEST.md / G15).
//
// WHAT IT DOES
//   Content routes that the consuming project marks `swr` in routeRules are
//   cached by Nitro (stale-while-revalidate). After a content change the admin
//   wants the cache cleared NOW instead of waiting for the TTL. This endpoint
//   clears the Nitro route/handler cache so the next request re-renders fresh —
//   replacing the old Nuxt-2 "regenerate the site" button WITHOUT an npm build.
//
// ⚠️ UNDOCUMENTED NITRO INTERNAL — version-coupled (G15).
//   There is no official invalidation API for routeRules caches. We clear the
//   Nitro cache storage by its internal key prefix. In nitropack 2.13.x the swr
//   route cache lives under the `cache` storage mount as keys shaped
//   `nitro:routes:_:<path>.<hash>.json` (groups `routes`/`handlers`/`functions`;
//   see nitropack/dist/runtime/internal/cache.mjs + app.mjs).
//
//   ‼️ VERIFIED PITFALL (the silent no-op the contract warns about):
//   `useStorage('cache').clear('nitro')` does NOT remove these keys with the
//   default memory driver (unstorage 1.17.x) — `clear()` no-ops on the
//   colon-namespaced keys, and the purge fails SILENTLY (HTTP 200, cache
//   untouched). The reliable purge is to enumerate the keys with
//   `getKeys(prefix)` and `removeItem()` each one. This was caught by the G15
//   smoke-test against nuxt 3.21.6 / nitropack 2.13.4 — see test/.
//
//   A Nitro/unstorage upgrade can change this key schema and re-break the purge
//   without any test failing on its own. That is exactly why the purge-smoke-
//   test (G15) MUST be re-run after every Nuxt/Nitro bump and the version is
//   pinned in package.json.
//   Ref: https://github.com/nuxt/nuxt/discussions/20495
//
// ZERO-CONFIG / OPT-IN
//   Auth-gated by a server-only token from runtimeConfig.purgeToken
//   (NUXT_PURGE_TOKEN). If no token is configured the endpoint is DISABLED and
//   returns 404 — a consumer that does not use A2 has no open purge endpoint.
//
// AUTH
//   The caller (a backend worker) sends the token in the `x-purge-token`
//   header. Matched in constant time against runtimeConfig.purgeToken.

import { timingSafeEqual } from 'node:crypto'

/** Prefixes inside the `cache` storage mount that hold Nitro's swr route cache.
 *  Pinned to nitropack 2.x internals — see header note + G15 smoke-test. */
const NITRO_CACHE_PREFIXES = ['nitro'] as const

/** Constant-time string comparison; avoids leaking token length/contents via timing. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) {
    // still do a compare to keep timing roughly constant, then fail
    timingSafeEqual(ba, ba)
    return false
  }
  return timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const purgeToken = useRuntimeConfig(event).purgeToken as string | undefined

  // Opt-in: no token configured → endpoint does not exist.
  if (!purgeToken) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const provided = getHeader(event, 'x-purge-token') || ''
  if (!safeEqual(provided, purgeToken)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const cache = useStorage('cache')
  let cleared = 0
  for (const prefix of NITRO_CACHE_PREFIXES) {
    // Enumerate then removeItem each key. We do NOT use clear(prefix): it
    // silently no-ops on the colon-namespaced Nitro cache keys with the default
    // memory/fs drivers (verified, unstorage 1.17.x) — see header note + G15.
    const keys = await cache.getKeys(prefix)
    await Promise.all(keys.map((k) => cache.removeItem(k)))
    cleared += keys.length
  }

  return { ok: true, purged: cleared, at: new Date().toISOString() }
})
