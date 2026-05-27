<template>
  <v-app class="adminWrapper">
    <v-app-bar color="surface" elevation="1">
      <v-app-bar-nav-icon @click="appStore.toggleDrawer()" />
      <v-app-bar-title>{{ appName }}</v-app-bar-title>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-logout" @click="onLogout">Logout</v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawerOpen">
      <v-list nav>
        <v-list-item to="/" prepend-icon="mdi-home" title="Home" />
        <v-list-item to="/admin" prepend-icon="mdi-shield-account" title="Admin" v-if="auth.isAdmin" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div class="adminWrap pa-4">
        <slot />
      </div>
    </v-main>

    <AppToast />
  </v-app>
</template>

<script setup>
import { computed } from 'vue'

definePageMeta({}) // ensure layout context

const config = useRuntimeConfig()
const appName = config.public.appName

const appStore = useAppStore()
const auth = useAuthStore()
const { logout } = useAuth()
const toast = useToast()
const router = useRouter()

const drawerOpen = computed({
  get: () => appStore.drawer,
  set: (v) => appStore.setDrawer(v),
})

async function onLogout() {
  await logout()
  toast.success('Abgemeldet')
  router.push('/')
}
</script>
