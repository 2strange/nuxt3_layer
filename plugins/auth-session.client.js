// Client-only session keeper (v0.5.0) — see utils/authSession.js.
//
// • Activity = real user interaction (pointer/key/touch/wheel), not requests:
//   someone drawing a signature for 20 minutes sends no request but is active.
// • Sliding refresh: active user + `refreshAt` share of the token lifetime
//   passed → swap the token (only when `auth.refreshPath` is configured).
// • Expired token: open the re-login dialog in place (only if it is mounted —
//   otherwise nothing changes; the next request 401s as before).
// • Several tabs share the auth cookie: a newer token of the SAME user that
//   another tab refreshed is adopted instead of expiring here.
// • Absolute session limit (backend): a refresh that doesn't extend exp stops
//   further refreshes; at exp the re-login dialog opens as usual.
import { log } from '~/services/log'
import {
  AUTH_COOKIE, authConfig, finishRelogin, readCookieToken, reloginAvailable,
  reloginState, requestRelogin, shouldRefresh, tokenTimes,
} from '~/utils/authSession'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel']
const ACTIVITY_THROTTLE_MS = 15_000
const TICK_MS = 30_000

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { refreshToken } = useAuth()
  const cfg = () => authConfig(useAppConfig())

  let lastActivity = Date.now() / 1000
  let lastMark = 0
  let refreshing = false
  let noGainExp = 0 // see shouldRefresh — set when the session limit is reached

  function adoptNewerCookieToken() {
    const cookieToken = readCookieToken(document.cookie, AUTH_COOKIE)
    if (!cookieToken || cookieToken === auth.token) return false
    const mine = tokenTimes(auth.token)
    const theirs = tokenTimes(cookieToken)
    if (!theirs || (mine && theirs.exp <= mine.exp)) return false
    if (mine?.sub && theirs.sub && mine.sub !== theirs.sub) return false // another user signed in elsewhere
    auth.token = cookieToken
    log.info('[auth] adopted newer token from another tab')
    return true
  }

  async function tick() {
    if (!auth.token) return
    const adopted = adoptNewerCookieToken()
    if (adopted && reloginState.open && reloginState.reason === 'expired') finishRelogin(true)

    const times = tokenTimes(auth.token)
    if (!times) return
    const now = Date.now() / 1000

    if (times.exp <= now) {
      if (reloginAvailable() && auth.user && cfg().reloginDialog !== false) requestRelogin('expired')
      return
    }
    if (refreshing || !cfg().refreshPath) return
    if (!shouldRefresh(times, { now, lastActivity, refreshAt: Number(cfg().refreshAt) || 0.5, noGainExp })) return

    refreshing = true
    try {
      if (await refreshToken()) {
        const fresh = tokenTimes(auth.token)
        if (fresh && fresh.exp <= times.exp) noGainExp = fresh.exp
      }
    } catch {
      // 401 on refresh: the token is already dead server-side (revoked/expired).
      if (reloginAvailable() && auth.user && cfg().reloginDialog !== false) requestRelogin('expired')
    } finally {
      refreshing = false
    }
  }

  function markActivity() {
    const nowMs = Date.now()
    if (nowMs - lastMark < ACTIVITY_THROTTLE_MS) return
    lastMark = nowMs
    lastActivity = nowMs / 1000
    tick()
  }

  for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, markActivity, { passive: true, capture: true })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
  setInterval(tick, TICK_MS)
})
