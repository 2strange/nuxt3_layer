<template>
  <v-app>
    <v-app-bar color="secondary" elevation="1">
      <v-app-bar-nav-icon @click="appStore.toggleAdminDrawer()" />
      <v-app-bar-title>Admin · {{ appStore.adminTitle || appName }}</v-app-bar-title>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-home" to="/">Frontend</v-btn>
      <v-btn variant="text" prepend-icon="mdi-logout" @click="onLogout">Logout</v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="adminDrawerOpen">
      <v-list nav>
        <v-list-item to="/admin" prepend-icon="mdi-view-dashboard" title="Dashboard" />
        <v-list-item to="/admin/users" prepend-icon="mdi-account-multiple" title="Users" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div class="pa-4">
        <slot />
      </div>
    </v-main>

    <AppToast />
  </v-app>
</template>

<script setup>
import { computed } from 'vue'

const config = useRuntimeConfig()
const appName = config.public.appName

const appStore = useAppStore()
const { logout } = useAuth()
const toast = useToast()
const router = useRouter()

const adminDrawerOpen = computed({
  get: () => appStore.adminDrawer,
  set: (v) => appStore.setAdminDrawer(v),
})

async function onLogout() {
  await logout()
  toast.success('Abgemeldet')
  router.push('/')
}
</script>
