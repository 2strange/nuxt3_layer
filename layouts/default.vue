<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title>
        <NuxtLink to="/" class="text-white text-decoration-none">{{ appName }}</NuxtLink>
      </v-app-bar-title>

      <v-spacer />

      <template v-if="auth.loggedIn">
        <v-btn variant="text" prepend-icon="mdi-account">{{ auth.user?.email }}</v-btn>
        <v-btn variant="text" prepend-icon="mdi-logout" @click="onLogout">{{ $t('nav.logout') }}</v-btn>
      </template>
      <template v-else>
        <v-btn variant="text" prepend-icon="mdi-login" to="/crew/login">{{ $t('nav.login') }}</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <AppToast />
  </v-app>
</template>

<script setup>
const config = useRuntimeConfig()
const appName = config.public.appName

const auth = useAuthStore()
const { logout } = useAuth()
const toast = useToast()
const router = useRouter()

async function onLogout() {
  await logout()
  toast.success('Abgemeldet')
  router.push('/')
}
</script>
