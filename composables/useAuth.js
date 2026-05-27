import { log } from '~/services/log'

// Auth flow tailored for the Rails JWT backend used by the old @nuxtjs/auth
// setup: POST auth/login -> token in `token` field, GET auth/user -> user object,
// DELETE auth/sign_out to logout.
export function useAuth() {
  const auth = useAuthStore()
  const api = useApi()

  async function loginLocal({ email, password, realm }) {
    log.info('[auth] loginLocal →', email, realm ? `(realm: ${realm})` : '')
    auth.loading = true
    auth.lastError = null
    try {
      // realm is optional — backend treats anything but 'ldap' as a local login.
      const userPayload = { email, password }
      if (realm) userPayload.realm = realm
      const resp = await api.post('auth/login', { user: userPayload })
      log.info('[auth] login response', resp)
      // Rails returns either { token: '...' } or wraps it.
      const token = resp?.token || resp?.data?.token
      if (!token) throw new Error('No token in login response: ' + JSON.stringify(resp))
      auth.setToken(token)
      await fetchUser()
      return auth.user
    } catch (err) {
      log.warn('[auth] loginLocal failed', err)
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
      log.info('[auth] /auth/user response', resp)
      // Rails returns a flat hash (get_user_json) — no { data: ... } wrapper.
      // But also handle JSON:API-style responses just in case.
      const userData = resp?.data?.attributes
        ? { id: resp.data.id, ...resp.data.attributes }
        : (resp?.data || resp)
      auth.setUser(userData)
      return auth.user
    } catch (err) {
      log.warn('[auth] fetchUser failed', err)
      auth.reset()
      return null
    }
  }

  async function logout() {
    try {
      // Devise path_names in this project: { sign_out: 'logout' }
      if (auth.token) await api.destroy('auth/logout')
    } catch (err) {
      log.warn('logout endpoint failed (ignored)', err)
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
