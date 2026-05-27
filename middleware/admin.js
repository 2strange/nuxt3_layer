import { log } from '~/services/log'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  log.info('Middleware | admin', to.path)

  if (!(auth.loggedIn && auth.user && auth.user.admin)) {
    log.info('Middleware | admin → no!')
    const query = !(auth.loggedIn && auth.user && auth.user.email) ? { back: to.path } : undefined
    return navigateTo({ path: '/403', query })
  }
})
