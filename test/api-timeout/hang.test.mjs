// Regression: a request whose connection stalls mid-flight must NOT leave a
// forever-pending promise. Without `timeout` on the ofetch instance, ofetch
// never creates an AbortController (ofetch 1.5.1, dist/shared/ofetch.*.mjs:261
// -> `if (!context.options.signal && context.options.timeout)`), so the promise
// neither resolves nor rejects: no catch, no finally, no error. In the app that
// means a user presses "log out", nothing happens, and the session stays open.
//
// Run:  npm run test:api-timeout
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFetch } from 'ofetch'
import { useApi } from '../../composables/useApi.js'

const TEST_TIMEOUT_MS = 80      // stubbed runtimeConfig value, keeps the suite fast
const SETTLE_BUDGET_MS = 1500   // generous: if it has not settled by now, it never will

// A stalled connection, modelled honestly: the promise stays pending forever
// and only ever settles because someone aborts it — exactly what the browser's
// fetch does when the TCP connection hangs. NOT an immediate reject: an
// immediate reject would pass even without the fix and prove nothing.
function makeHangingFetch() {
  const calls = []
  const fetchStub = (request, options = {}) => {
    calls.push({ request, options })
    return new Promise((_resolve, reject) => {
      const { signal } = options
      if (!signal) return                                  // nothing can ever settle this
      if (signal.aborted) return reject(signal.reason ?? new Error('aborted'))
      signal.addEventListener('abort', () => reject(signal.reason ?? new Error('aborted')))
    })
  }
  return { fetchStub, calls }
}

function makeRespondingFetch(body = { ok: true }) {
  return () => Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }))
}

// Minimal Nuxt surface useApi()/useAuth() touch at call time.
function installNuxtStubs(fetchImpl, { apiTimeout = TEST_TIMEOUT_MS, apiLogoutTimeout = TEST_TIMEOUT_MS / 2, token = 'test-token' } = {}) {
  const authStore = {
    token,
    user: null,
    reset() { this.token = null },
    setToken(t) { this.token = t },
    setUser(u) { this.user = u },
  }
  globalThis.useNuxtApp = () => ({ $i18n: { locale: { value: '' } } })
  globalThis.useAuthStore = () => authStore
  globalThis.useRuntimeConfig = () => ({
    public: { apiBase: 'http://backend.test', apiTimeout, apiLogoutTimeout },
    apiBaseServer: '',
  })
  globalThis.navigateTo = () => {}
  globalThis.$fetch = createFetch({ fetch: fetchImpl })
  globalThis.useApi = useApi   // Nuxt auto-import, which useAuth() relies on
  return authStore
}

// Returns 'resolved' | 'rejected' | 'pending' — never hangs the test runner.
async function settlementOf(promise, budget = SETTLE_BUDGET_MS) {
  let timer
  const sentinel = new Promise((resolve) => { timer = setTimeout(() => resolve('pending'), budget) })
  const result = await Promise.race([
    promise.then(() => 'resolved', () => 'rejected'),
    sentinel,
  ])
  clearTimeout(timer)
  return result
}

test('a stalled request settles instead of hanging forever', async () => {
  const { fetchStub } = makeHangingFetch()
  installNuxtStubs(fetchStub)

  const settlement = await settlementOf(useApi().destroy('auth/logout'))

  assert.notEqual(settlement, 'pending',
    'DELETE auth/logout never settled: the shared $fetch instance carries no timeout, so ofetch builds no AbortController')
  assert.equal(settlement, 'rejected', 'a stalled request must surface as a rejection')
})

test('logout() completes and resets auth state even when the request stalls', async () => {
  // Instance default deliberately far out of reach: only the logout-specific,
  // tighter limit can make this settle inside the budget. Otherwise this test
  // would pass on the instance default alone and prove nothing about logout.
  const { fetchStub } = makeHangingFetch()
  const authStore = installNuxtStubs(fetchStub, { apiTimeout: 60_000, apiLogoutTimeout: TEST_TIMEOUT_MS / 2 })
  const { useAuth } = await import('../../composables/useAuth.js')

  const settlement = await settlementOf(useAuth().logout())

  assert.notEqual(settlement, 'pending',
    'logout() never returned: its finally { auth.reset() } cannot run while the request promise stays pending')
  assert.equal(settlement, 'resolved', 'logout() swallows the request error by design')
  assert.equal(authStore.token, null, 'the local session must be gone after logout()')
})

test('the logout limit may only shorten the instance timeout, never lengthen it', async () => {
  // A project that lowered apiTimeout below the logout default must not end up
  // waiting LONGER on its logout than on anything else.
  const { fetchStub } = makeHangingFetch()
  const authStore = installNuxtStubs(fetchStub, { apiTimeout: TEST_TIMEOUT_MS, apiLogoutTimeout: 60_000 })
  const { useAuth } = await import('../../composables/useAuth.js')

  const started = Date.now()
  const settlement = await settlementOf(useAuth().logout())

  assert.equal(settlement, 'resolved', 'logout() must still return')
  assert.ok(Date.now() - started < SETTLE_BUDGET_MS,
    'logout waited for its own 60s limit instead of the tighter instance timeout')
  assert.equal(authStore.token, null)
})

test('a responding request is untouched by the timeout', async () => {
  installNuxtStubs(makeRespondingFetch({ hello: 'world' }))

  const body = await useApi().get('auth/user')

  assert.deepEqual(body, { hello: 'world' })
})

test('a slow-but-answering request survives a per-call timeout override', async () => {
  // Positive control for the escape hatch: a call that legitimately takes longer
  // than the instance default must be able to raise its own limit.
  const slowFetch = () => new Promise((resolve) => setTimeout(
    () => resolve(new Response('{"done":true}', { status: 200, headers: { 'content-type': 'application/json' } })),
    TEST_TIMEOUT_MS * 3,
  ))
  installNuxtStubs(slowFetch)

  const body = await useApi().post('imports', { big: 'upload' }, { timeout: TEST_TIMEOUT_MS * 20 })

  assert.deepEqual(body, { done: true })
})
