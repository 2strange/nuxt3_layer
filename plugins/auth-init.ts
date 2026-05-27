// Runs on BOTH server and client.
// On SSR: reads the auth cookie, fetches the user from Rails, populates the
// Pinia store — Nuxt then serializes the store into the payload, so the client
// hydrates with `auth.user` already set. Without this, route middleware on
// SSR would see `loggedIn === false` and bounce protected pages to /403.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  auth.hydrateFromCookie()

  if (auth.token && !auth.user) {
    const { fetchUser } = useAuth()
    await fetchUser()
  }

  // js-cookie is browser-only; gate the UI-cookie init.
  if (import.meta.client) {
    const appStore = useAppStore()
    appStore.initCookies()
  }
})
