import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

// Cookie-consent key — overridable per project via app.config
// (`cookiesAcceptedKey`). Falls back to the historical default so existing
// apps keep recognizing already-set consent cookies (zero-config drop-in).
function cookiesAcceptedKey() {
  try {
    const key = useAppConfig()?.cookiesAcceptedKey
    if (key) return key
  } catch (e) {
    // outside of a Nuxt app context (e.g. plain unit test) — use the default
  }
  return 'slBkngCookiesOK'
}

export const useAppStore = defineStore('app', {
  state: () => ({
    drawer: null,
    clipped: true,
    fixed: false,

    infoDrawer: false,
    newsDialog: false,

    cookiesAccepted: false,

    adminDrawer: true,
    adminTitle: '',
    adminAside: null,
    adminAsideData: {},

    projects: [],
    analyses: [],
  }),

  getters: {
    drawerState: (state) => state.drawer,
  },

  actions: {
    // Nav drawer
    toggleDrawer() { this.drawer = !this.drawer },
    setDrawer(value) { this.drawer = value },

    toggleFixed() { this.fixed = !this.fixed },
    toggleClipped() { this.clipped = !this.clipped },

    toggleInfoDrawer() { this.infoDrawer = !this.infoDrawer },
    setInfoDrawer(value) { this.infoDrawer = value },

    toggleNewsDialog() { this.newsDialog = !this.newsDialog },
    setNewsDialog(value) { this.newsDialog = value },

    // Admin
    setAdminDrawer(value) { this.adminDrawer = value },
    setAdminTitle(value) { this.adminTitle = value },
    toggleAdminDrawer() { this.adminDrawer = !this.adminDrawer },
    setAdminAside(value) { this.adminAside = value },
    setAdminAsideData(value) { this.adminAsideData = value },

    // Cookies
    initCookies() {
      this.cookiesAccepted = !!Cookies.get(cookiesAcceptedKey())
    },
    acceptCookies() {
      this.cookiesAccepted = true
      Cookies.set(cookiesAcceptedKey(), 'true', { expires: 365 })
    },
  },
})
