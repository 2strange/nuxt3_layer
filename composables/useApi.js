import { apiPath, backendPath, adminPath, sendOptions, sendObjekt } from '~/utils/api'
import { log } from '~/services/log'

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
    onResponseError({ response }) {
      log.warn('[api] error', response?.status, response?._data)
      if (response?.status && [401, 402, 403].includes(response.status)) {
        authStore.reset()
        if (import.meta.client && window.location.pathname !== '/403' && window.location.pathname !== '/crew/login') {
          navigateTo('/403')
        }
      }
    },
  })
}

function locale() {
  const nuxt = useNuxtApp()
  return nuxt.$i18n?.locale?.value || ''
}

export function useApi() {
  const api = buildFetch()

  // raw verbs
  const raw = {
    get:     (path)              => { log.debug('$api GET',    path);     return api(path, { method: 'GET' }) },
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
