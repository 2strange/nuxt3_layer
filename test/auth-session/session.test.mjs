// Session keeping (v0.5.0): sliding refresh + re-login in place instead of the
// hard 401 → reset → /403 redirect that threw away in-memory form data
// (KeyHub: lost forms + signatures after the fixed 6h JWT lifetime).
//
// Run:  npm run test:auth-session
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFetch } from 'ofetch'
import {
  decodeJwtPayload, tokenTimes, shouldRefresh, isAuthEndpoint, readCookieToken,
  reloginState, finishRelogin, reloginPending,
} from '../../utils/authSession.js'
import { useApi } from '../../composables/useApi.js'
import { useAuth } from '../../composables/useAuth.js'

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (payload) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.sig`

// --- stubs ------------------------------------------------------------------
let calls, navigations, routes, appAuth
function install({ user = { id: 7, email: 'a@b.c' }, token = 'old-token' } = {}) {
  calls = []
  navigations = []
  appAuth = {}
  const authStore = {
    token, user, loading: false, lastError: null,
    reset() { this.token = null; this.user = null },
    setToken(t) { this.token = t },
    setUser(u) { this.user = u },
  }
  // routes: path → (request) => { status, body }
  const fetchImpl = async (request, options = {}) => {
    const url = String(request).replace('http://backend.test/', '')
    const auth = new Headers(options.headers).get('Authorization')
    const body = options.body
    calls.push({ url, method: options.method, auth, body })
    const handler = routes[url] || (() => ({ status: 200, body: { ok: true } }))
    const { status, body: resBody } = handler({ auth, body })
    return new Response(JSON.stringify(resBody ?? {}), { status, headers: { 'content-type': 'application/json' } })
  }
  globalThis.useNuxtApp = () => ({ $i18n: { locale: { value: '' } } })
  globalThis.useAuthStore = () => authStore
  globalThis.useAppConfig = () => ({ auth: appAuth })
  globalThis.useRuntimeConfig = () => ({ public: { apiBase: 'http://backend.test', apiTimeout: 2000 }, apiBaseServer: '' })
  globalThis.navigateTo = (to) => { navigations.push(to) }
  globalThis.$fetch = createFetch({ fetch: fetchImpl })
  globalThis.useApi = useApi
  return authStore
}

beforeEach(() => {
  routes = {}
  if (reloginPending()) finishRelogin(false)
  reloginState.mounted = 0
})

const tick = () => new Promise((r) => setTimeout(r, 10))

// --- pure helpers -----------------------------------------------------------
test('decodes the JWT payload (base64url, unicode)', () => {
  const t = jwt({ sub: '7', exp: 2000, iat: 1000, name: 'Jörg' })
  assert.equal(decodeJwtPayload(t).name, 'Jörg')
  assert.deepEqual(tokenTimes(t), { iat: 1000, exp: 2000, sub: '7' })
  assert.equal(tokenTimes('garbage'), null)
  assert.equal(tokenTimes(jwt({ sub: 1 })), null, 'no exp → no session timing')
})

test('refresh only for an active user after the configured share of the lifetime', () => {
  const times = { iat: 1000, exp: 1000 + 21600 } // 6h
  assert.equal(shouldRefresh(times, { now: 1000 + 3600, lastActivity: 1000 + 3500 }), false, 'too early')
  assert.equal(shouldRefresh(times, { now: 1000 + 11000, lastActivity: 1000 + 10900 }), true, 'halfway + active')
  assert.equal(shouldRefresh(times, { now: 1000 + 11000, lastActivity: 900 }), false, 'inactive since login → let it expire')
  assert.equal(shouldRefresh(times, { now: 1000 + 30000, lastActivity: 1000 + 29000 }), false, 'already expired → re-login, not refresh')
  assert.equal(shouldRefresh(times, { now: 1000 + 5500, lastActivity: 1000 + 5400, refreshAt: 0.25 }), true, 'refreshAt is configurable')
})

test('absolute session limit: no refresh loop once exp stops growing', () => {
  // backend capped exp at login + max age → refreshed token ends where the old one did
  const capped = { iat: 5000, exp: 6000 }
  assert.equal(shouldRefresh(capped, { now: 5600, lastActivity: 5590 }), true, 'without the marker it would refresh again')
  assert.equal(shouldRefresh(capped, { now: 5600, lastActivity: 5590, noGainExp: 6000 }), false, 'limit reached → let it expire')
  assert.equal(shouldRefresh({ iat: 7000, exp: 28600 }, { now: 18000, lastActivity: 17990, noGainExp: 6000 }), true, 'new login (later exp) refreshes again')
})

test('login/logout/refresh calls are never answered with the dialog', () => {
  assert.equal(isAuthEndpoint('auth/login'), true)
  assert.equal(isAuthEndpoint('/api/auth/logout'), true)
  assert.equal(isAuthEndpoint('auth/refresh', 'auth/refresh'), true)
  assert.equal(isAuthEndpoint('auth/user'), false)
  assert.equal(isAuthEndpoint('api/de/forms/12'), false)
})

test('reads the auth cookie of another tab', () => {
  assert.equal(readCookieToken('a=1; auth.token=abc.def.ghi; b=2'), 'abc.def.ghi')
  assert.equal(readCookieToken('auth.token=null'), null)
  assert.equal(readCookieToken(''), null)
})

// --- useApi -----------------------------------------------------------------
test('without a mounted dialog a 401 behaves exactly as before (reset + /403)', async () => {
  const store = install()
  routes['api/forms'] = () => ({ status: 401 })
  await assert.rejects(useApi().post('api/forms', { a: 1 }))
  assert.equal(store.token, null)
  assert.equal(store.user, null)
})

test('with the dialog: a 401 waits for re-login, then the SAME request is retried with the new token', async () => {
  const store = install()
  reloginState.mounted = 1
  routes['api/forms'] = ({ auth }) => auth === 'Bearer new-token' ? { status: 201, body: { saved: true } } : { status: 401 }

  const signature = { objekt: { signature: 'data:image/png;base64,AAAA' } }
  const pending = useApi().post('api/forms', signature)
  await tick()
  assert.equal(reloginState.open, true, 'dialog opened')
  assert.equal(store.user?.id, 7, 'user kept in memory (no reset)')
  assert.equal(navigations.length, 0, 'no redirect — the page and its data stay')

  store.setToken('new-token')     // what the dialog does after a successful re-login
  finishRelogin(true)
  assert.deepEqual(await pending, { saved: true })
  const posts = calls.filter((c) => c.url === 'api/forms')
  assert.equal(posts.length, 2, 'retried exactly once')
  assert.equal(posts[1].body, posts[0].body, 'same payload re-sent')
})

test('parallel 401s share ONE dialog and are all retried', async () => {
  const store = install()
  reloginState.mounted = 1
  routes['api/a'] = ({ auth }) => auth === 'Bearer new' ? { status: 200, body: { a: 1 } } : { status: 401 }
  routes['api/b'] = ({ auth }) => auth === 'Bearer new' ? { status: 200, body: { b: 2 } } : { status: 401 }
  const api = useApi()
  const both = Promise.all([api.put('api/a', {}), api.get('api/b')])
  await tick()
  assert.equal(reloginState.open, true)
  store.setToken('new')
  finishRelogin(true)
  assert.deepEqual(await both, [{ a: 1 }, { b: 2 }])
})

test('giving up / another user: waiting requests fail with the original 401, nothing is re-sent', async () => {
  install()
  reloginState.mounted = 1
  routes['api/forms'] = () => ({ status: 401 })
  const pending = useApi().post('api/forms', { x: 1 })
  await tick()
  finishRelogin(false)
  await assert.rejects(pending, (e) => e?.response?.status === 401)
  assert.equal(calls.filter((c) => c.url === 'api/forms').length, 1)
})

test('wrong password on login stays a plain error (no dialog for auth endpoints)', async () => {
  install()
  reloginState.mounted = 1
  routes['auth/login'] = () => ({ status: 401, body: { error: 'Invalid' } })
  await assert.rejects(useApi().post('auth/login', { user: {} }))
  assert.equal(reloginState.open, false)
})

test('402/403 keep the old behaviour even with the dialog', async () => {
  const store = install()
  reloginState.mounted = 1
  routes['api/x'] = () => ({ status: 403 })
  await assert.rejects(useApi().get('api/x'))
  assert.equal(reloginState.open, false)
  assert.equal(store.token, null, 'reset as before')
})

test('reloginDialog:false in app.config restores the old 401 behaviour', async () => {
  const store = install()
  appAuth.reloginDialog = false
  reloginState.mounted = 1
  routes['api/x'] = () => ({ status: 401 })
  await assert.rejects(useApi().get('api/x'))
  assert.equal(reloginState.open, false)
  assert.equal(store.token, null)
})

// --- useAuth ----------------------------------------------------------------
test('refreshToken swaps the token via auth.refreshPath', async () => {
  const store = install()
  appAuth.refreshPath = 'auth/refresh'
  routes['auth/refresh'] = ({ auth }) => auth === 'Bearer old-token' ? { status: 200, body: { token: 'fresh' } } : { status: 401 }
  assert.equal(await useAuth().refreshToken(), true)
  assert.equal(store.token, 'fresh')
})

test('refreshToken is a no-op without refreshPath (zero-config)', async () => {
  install()
  assert.equal(await useAuth().refreshToken(), false)
  assert.equal(calls.length, 0)
})

test('reloginLocal tells same vs. other user apart', async () => {
  const store = install()
  routes['auth/login'] = () => ({ status: 200, body: { token: 'n1' } })
  routes['auth/user'] = () => ({ status: 200, body: { id: 7, email: 'a@b.c' } })
  assert.equal(await useAuth().reloginLocal({ email: 'a@b.c', password: 'x' }), 'same')

  store.user = { id: 7 }
  routes['auth/user'] = () => ({ status: 200, body: { id: 99 } })
  assert.equal(await useAuth().reloginLocal({ email: 'z@b.c', password: 'x' }), 'other')
})

test('reloginLocal with a wrong password throws and keeps the user (dialog stays)', async () => {
  const store = install()
  routes['auth/login'] = () => ({ status: 401, body: { error: 'Invalid' } })
  await assert.rejects(useAuth().reloginLocal({ email: 'a@b.c', password: 'bad' }))
  assert.equal(store.user?.id, 7)
  assert.equal(store.token, 'old-token')
})
