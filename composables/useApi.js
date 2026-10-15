import { apiPath, backendPath, adminPath, sendOptions, sendObjekt } from '~/utils/api'
import { log } from '~/services/log'
import { authConfig, isAuthEndpoint, reloginAvailable, requestRelogin } from '~/utils/authSession'

function appAuthConfig() {
  return authConfig(typeof useAppConfig === 'function' ? useAppConfig() : null)
}

// A 401 goes to the re-login dialog (instead of reset + redirect) when the
// dialog is mounted, the user was signed in, it isn't a login/logout/refresh
// call and the caller didn't opt out (`authRedirect: false` = handle it yourself).
function reloginHandles(path, options, authStore) {
  const cfg = appAuthConfig()
  return cfg.reloginDialog !== false
    && reloginAvailable()
    && !!authStore.user
    && options?.authRedirect !== false
    && !isAuthEndpoint(path, cfg.refreshPath)
}

// Lazily-built ofetch instance with auth headers and base URL.
function buildFetch() {
  const { $i18n } = useNuxtApp()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const baseURL = import.meta.server ? (config.apiBaseServer || config.public.apiBase) : config.public.apiBase

  return $fetch.create({
    baseURL,
    onRequest({ options }) {
      // options.headers can be a Headers instance, an array of tuples, or a
      // plain object depending on caller. Normalize via Headers API.
      const headers = new Headers(options.headers || {})
      if (authStore.token) {
        headers.set('Authorization', `Bearer ${authStore.token}`)
      }
      if (!headers.has('Accept')) headers.set('Accept', 'application/json')
      options.headers = headers
    },
    onResponseError({ request, options, response }) {
      log.warn('[api] error', response?.status) // no response._data (may echo secrets)
      if (options?.authRedirect === false) return // caller handles auth errors itself
      if (response?.status === 401 && reloginHandles(request, options, authStore)) return // → withRelogin
      if (response?.status && [401, 402, 403].includes(response.status)) {
        authStore.reset()
        const loginPath = appAuthConfig().loginPath
        if (import.meta.client && window.location.pathname !== '/403' && window.location.pathname !== loginPath) {
          navigateTo('/403')
        }
      }
    },
  })
}

// 401 while the re-login dialog is available: wait for the user to sign in
// again (all parallel 401s share one dialog), then retry the request once with
// the new token. A 401 means the server did NOT process the request, so the
// retry can't double-submit. Gave up / other user → the original error.
function withRelogin(fetcher) {
  const authStore = useAuthStore()
  return async (path, options = {}) => {
    try {
      return await fetcher(path, options)
    } catch (err) {
      const status = err?.response?.status ?? err?.statusCode ?? err?.status
      if (status !== 401 || !reloginHandles(path, options, authStore)) throw err
      log.info('[api] 401 → waiting for re-login')
      const ok = await requestRelogin('unauthorized')
      if (!ok) throw err
      return fetcher(path, options)
    }
  }
}

function locale() {
  const nuxt = useNuxtApp()
  return nuxt.$i18n?.locale?.value || ''
}

export function useApi() {
  const api = withRelogin(buildFetch())

  // raw verbs
  const raw = {
    get:     (path, opts)        => { log.debug('$api GET',    path);     return api(path, { method: 'GET', ...(opts || {}) }) },
    post:    (path, body, opts)  => { log.debug('$api POST',   path, body); return api(path, { method: 'POST',   body, ...(opts || {}) }) },
    put:     (path, body, opts)  => { log.debug('$api PUT',    path, body); return api(path, { method: 'PUT',    body, ...(opts || {}) }) },
    destroy: (path)              => { log.debug('$api DELETE', path);     return api(path, { method: 'DELETE' }) },
  }

  // REST helpers (default namespace = "")
  function restFor(pathBuilder) {
    return {
      index: (path)                      => raw.get(pathBuilder(locale(), path)),
      show:  (path, objektOrId)          => raw.get(pathBuilder(locale(), path, objektOrId)),
      create: (path, objekt, fileForm = false) => {
        const data = { obj: { objekt }, fileForm }
        return raw.post(pathBuilder(locale(), path), sendObjekt(data), sendOptions(fileForm))
      },
      update: (path, objekt, fileForm = false) => {
        const data = { obj: { objekt }, fileForm }
        return raw.put(pathBuilder(locale(), path, objekt), sendObjekt(data), sendOptions(fileForm))
      },
      save(path, objekt, fileForm = false) {
        return objekt.id ? this.update(path, objekt, fileForm) : this.create(path, objekt, fileForm)
      },
      delete: (path, objektOrId)         => raw.destroy(pathBuilder(locale(), path, objektOrId)),
    }
  }

  return {
    ...raw,
    ...restFor(apiPath),            // index/show/create/update/save/delete → /api/...
    backend: restFor(backendPath),  // → /backend/...
    admin:   restFor(adminPath),    // → /admin/...
  }
}
