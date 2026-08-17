// Request-timeout policy for the shared useApi() instance.
//
// Pure helpers on purpose: they take the already-resolved `runtimeConfig.public`
// instead of calling `useRuntimeConfig()` themselves. That keeps them importable
// from anywhere (and testable without a Nuxt context), and it keeps them out of
// composables/ — every named export there becomes a Nuxt auto-import in EVERY
// consuming project, and `apiTimeout` is far too generic a name to claim
// globally. Consumers also alias `~/utils` at the layer in their unit-test
// setups, while `~/composables` stays pointed at their own app.
//
// Why a timeout exists at all: ofetch only builds an AbortController when
// `timeout` is set (ofetch 1.5.1, dist/shared/ofetch.CWycOUEr.mjs:261). Without
// one, a request whose connection stalls mid-flight leaves a promise that NEVER
// settles — no catch, no finally, no error. Spinners spin forever and
// `finally`-blocks (session reset, loading flags) never run.

// Safety net, not a performance budget. Deliberately generous: the window covers
// server think time AND the upload of the request body (it is cleared as soon as
// response headers arrive, so large downloads are unaffected). It must therefore
// sit above the slowest legitimate upload in any consuming project — its job is
// to turn "hangs forever" into "fails eventually", not to police slow requests.
// Projects lower it via runtimeConfig.public.apiTimeout (NUXT_PUBLIC_API_TIMEOUT);
// individual calls raise or lower it via the per-call `timeout` option.
export const DEFAULT_API_TIMEOUT_MS = 120_000

// Logging out is the one call where a stalled request lies to the user: they
// press "log out", see nothing happen, and walk away from a device that still
// carries an open session. Everywhere else a hanging request shows a spinner —
// nobody believes the work is done. So that one path gets a much tighter limit.
export const DEFAULT_LOGOUT_TIMEOUT_MS = 10_000

function positiveOr(value, fallback) {
  const n = Number(value)
  return n > 0 ? n : fallback
}

// Instance-wide fallback timeout in ms. Per-call `timeout` options win over it
// (ofetch merges call options on top of instance defaults).
export function apiTimeoutFrom(publicConfig) {
  return positiveOr(publicConfig?.apiTimeout, DEFAULT_API_TIMEOUT_MS)
}

// Never LENGTHEN what the instance already allows — a project that lowered
// apiTimeout must not get a longer wait on its logout of all things.
export function logoutTimeoutFrom(publicConfig) {
  const wanted = positiveOr(publicConfig?.apiLogoutTimeout, DEFAULT_LOGOUT_TIMEOUT_MS)
  return Math.min(wanted, apiTimeoutFrom(publicConfig))
}
