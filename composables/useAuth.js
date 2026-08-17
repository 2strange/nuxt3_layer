import { log } from '~/services/log'
import { logoutTimeoutFrom } from '~/utils/apiTimeouts'

// Auth flow tailored for the Rails JWT backend used by the old @nuxtjs/auth
// setup: POST auth/login -> token in `token` field, GET auth/user -> user object,
// DELETE auth/sign_out to logout.
export function useAuth() {
  const auth = useAuthStore()
  const api = useApi()

  async function loginLocal({ email, password, realm }) {
    log.info('[auth] loginLocal', realm ? `(realm: ${realm})` : '') // no email (PII)
    auth.loading = true
    auth.lastError = null
    try {
      // realm is optional — backend treats anything but 'ldap' as a local login.
      const userPayload = { email, password }
      if (realm) userPayload.realm = realm
      const resp = await api.post('auth/login', { user: userPayload })
      // NEVER log the response — it carries the JWT. Log only a non-sensitive marker.
      log.info('[auth] login response received, token present:', !!(resp?.token || resp?.data?.token))
      // Rails returns either { token: '...' } or wraps it.
      const token = resp?.token || resp?.data?.token
      if (!token) throw new Error('No token in login response') // don't stringify resp (may carry secrets)
      auth.setToken(token)
      await fetchUser()
      return auth.user
    } catch (err) {
      log.warn('[auth] loginLocal failed:', err?.message || String(err)) // message only — err body may echo secrets
      auth.lastError = err
      auth.reset()
      throw err
    } finally {
      auth.loading = false
    }
  }

  async function fetchUser() {
    if (!auth.token) return null
    try {
      const resp = await api.get('auth/user')
      log.info('[auth] /auth/user response received') // never log the response (PII/token)
      // Rails returns a flat hash (get_user_json) — no { data: ... } wrapper.
      // But also handle JSON:API-style responses just in case.
      const userData = resp?.data?.attributes
        ? { id: resp.data.id, ...resp.data.attributes }
        : (resp?.data || resp)
      auth.setUser(userData)
      return auth.user
    } catch (err) {
      log.warn('[auth] fetchUser failed:', err?.message || String(err)) // message only — err body may echo secrets
      // Only an explicit auth rejection (401/403) invalidates the session.
      // Network errors / 5xx must NOT nuke the auth state — the token may
      // still be perfectly valid. (useApi additionally handles 401/402/403
      // globally with reset + redirect.)
      const status = err?.response?.status ?? err?.status ?? err?.statusCode
      if (status === 401 || status === 403) auth.reset()
      return null
    }
  }

  async function logout() {
    try {
      // Devise path_names in this project: { sign_out: 'logout' }
      // Tighter than the instance default: a stalled logout makes the user
      // believe they are signed out while the session stays open. The finally
      // below only runs once this request settles. See ~/utils/apiTimeouts.
      const timeout = logoutTimeoutFrom(useRuntimeConfig()?.public)
      if (auth.token) await api.destroy('auth/logout', { timeout })
    } catch (err) {
      log.warn('logout endpoint failed (ignored):', err?.message || String(err))
    } finally {
      auth.reset()
    }
  }

  return {
    auth,
    loginLocal,
    fetchUser,
    logout,
  }
}
