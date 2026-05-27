import { log } from '~/services/log'

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  log.info('Middleware | guest |', !auth.loggedIn)

  if (auth.loggedIn && auth.user && auth.user.email) {
    return navigateTo('/')
  }
})
