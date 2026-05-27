import { log } from '~/services/log'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  log.info('Middleware | authenticated')

  if (!(auth.loggedIn && auth.user && auth.user.email)) {
    return navigateTo({ path: '/403', query: { back: to.path } })
  }
})
