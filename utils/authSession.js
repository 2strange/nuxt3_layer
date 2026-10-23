// Session keeping for the Rails devise-jwt backend (v0.5.0).
//
// Problem this solves: the JWT expires a fixed time after login. Before, the
// first request after that got a 401, useApi reset the auth state and
// navigated to /403 — everything the user had typed (forms, signatures) was
// gone. Now:
//   1. Sliding refresh: while the user is active, the token is renewed before
//      it expires (needs a refresh endpoint, see `auth.refreshPath`).
//   2. Re-login in place: an expired token or a 401 opens <AuthReloginDialog>
//      OVER the page; the failed requests wait and are retried after the
//      re-login. Nothing is stored on the device, nothing is lost.
//
// Drop-in safe: without a mounted <AuthReloginDialog> (custom layouts that
// don't include it yet) every 401 behaves exactly as before.
//
// This module is plain JS (no Pinia) so it is unit-testable with `node --test`.
// The reactive state is only ever MUTATED on the client (the dialog mounts in
// onMounted), so the module-level object can't leak between SSR requests.
import { reactive } from 'vue'

export const AUTH_COOKIE = 'auth.token'

export const AUTH_DEFAULTS = {
  loginPath: '/crew/login',
  // Endpoint that returns a fresh token for the current user ({ token }),
  // e.g. 'auth/refresh'. Empty = no sliding refresh (zero-config default).
  refreshPath: '',
  // Refresh once this share of the token lifetime has passed (0.5 = halfway).
  refreshAt: 0.5,
  // false = keep the old 401 behaviour (reset + redirect) even with the dialog mounted.
  reloginDialog: true,
  // Tokens carrying one of these claims belong to the app, not to the session
  // keeper: no refresh, no re-login dialog, a 401 behaves as before. E.g. a
  // kiosk/device token with its own lifecycle: ['kiosk_session'].
  unmanagedClaims: [],
}

export function authConfig(appConfig) {
  return { ...AUTH_DEFAULTS, ...((appConfig && appConfig.auth) || {}) }
}

// --- JWT helpers (no signature check — the server does that) ----------------

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    const json = typeof atob === 'function'
      ? decodeURIComponent(Array.from(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''))
      : Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

// { iat, exp, sub } in seconds, or null when the token carries no exp.
export function tokenTimes(token) {
  const p = decodeJwtPayload(token)
  if (!p || typeof p.exp !== 'number') return null
  const iat = typeof p.iat === 'number' ? p.iat : null
  return { iat, exp: p.exp, sub: p.sub != null ? String(p.sub) : null }
}

// false when the token carries one of `auth.unmanagedClaims` (truthy value).
export function isManagedToken(token, cfg = AUTH_DEFAULTS) {
  const claims = Array.isArray(cfg?.unmanagedClaims) ? cfg.unmanagedClaims : []
  if (!claims.length) return true
  const p = decodeJwtPayload(token)
  return !p || !claims.some((c) => !!p[c])
}

// Refresh when the user was active since the token was issued and the
// configured share of its lifetime has passed. Times in seconds.
// `noGainExp`: exp of a refreshed token that did NOT outlive its predecessor —
// the backend's absolute session limit was reached (api_generator
// jwt_max_session_age), refreshing again can't help, so stop until the next login.
export function shouldRefresh({ iat, exp }, { now, lastActivity, refreshAt = 0.5, noGainExp = 0 }) {
  if (!exp || exp <= now) return false
  if (noGainExp && exp <= noGainExp) return false
  const issued = iat ?? exp - 3600
  const lifetime = exp - issued
  if (lifetime <= 0) return false
  const activeSinceIssue = lastActivity >= issued
  return activeSinceIssue && (now - issued) >= lifetime * refreshAt
}

// Login / logout / refresh 401s mean "wrong credentials" or "already gone" —
// never answer those with the re-login dialog.
export function isAuthEndpoint(path, refreshPath = '') {
  const p = String(path || '').split('?')[0].replace(/^\/+/, '')
  if (/(^|\/)auth\/(login|logout|sign_in|sign_out)\/?$/.test(p)) return true
  const r = String(refreshPath || '').replace(/^\/+/, '')
  return !!r && (p === r || p.endsWith('/' + r))
}

export function readCookieToken(cookieString, name = AUTH_COOKIE) {
  if (!cookieString) return null
  for (const part of cookieString.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) {
      const raw = decodeURIComponent(v.join('='))
      return raw && raw !== 'null' ? raw : null
    }
  }
  return null
}

// --- Re-login gate -----------------------------------------------------------
// All 401'd requests await ONE pending promise; the dialog resolves it with
// true (same user signed in again → retry) or false (gave up / other user).

export const reloginState = reactive({
  mounted: 0,       // how many <AuthReloginDialog> instances are mounted (client only)
  open: false,
  reason: null,     // 'expired' | 'unauthorized'
})

let pending = null
let resolvePending = null

export function reloginAvailable() {
  return reloginState.mounted > 0
}

export function requestRelogin(reason = 'unauthorized') {
  if (!pending) {
    pending = new Promise((resolve) => { resolvePending = resolve })
    reloginState.reason = reason
    reloginState.open = true
  }
  return pending
}

export function finishRelogin(ok) {
  const resolve = resolvePending
  pending = null
  resolvePending = null
  reloginState.open = false
  reloginState.reason = null
  if (resolve) resolve(!!ok)
}

export function reloginPending() {
  return !!pending
}
