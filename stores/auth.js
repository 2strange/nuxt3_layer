import { defineStore } from 'pinia'

// Cookie options shared by all reads/writes of the auth token.
// - 30-day maxAge: token persists across browser restarts
// - sameSite: 'lax' — blocks cross-site POSTs from sending the cookie
// - secure: true in prod — cookie only sent over HTTPS
// - NOT httpOnly: we deliberately need JS access to attach the token as a
//   Bearer header. The trade-off is that an XSS bug can read the token.
const AUTH_COOKIE = 'auth.token'
const authCookieOptions = () => ({
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax',
  secure: !import.meta.dev,
  path: '/',
})

// Token + user store. Token is persisted in a cookie via useCookie so it
// survives reload and is available on both server and client during SSR.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    lastError: null,
  }),

  getters: {
    loggedIn: (state) => !!state.token && !!state.user,
    isAdmin:  (state) => !!(state.user && state.user.admin),
    isMaster: (state) => !!(state.user && state.user.master),
  },

  actions: {
    setToken(token) {
      this.token = token
      const cookie = useCookie(AUTH_COOKIE, authCookieOptions())
      cookie.value = token || null
    },

    setUser(user) {
      this.user = user
    },

    reset() {
      this.user = null
      this.token = null
      const cookie = useCookie(AUTH_COOKIE, authCookieOptions())
      cookie.value = null
    },

    hydrateFromCookie() {
      const cookie = useCookie(AUTH_COOKIE, authCookieOptions())
      if (cookie.value && !this.token) {
        this.token = cookie.value
      }
    },
  },
})
