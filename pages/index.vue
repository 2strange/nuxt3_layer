<template>
  <div class="section">
    <div class="corset md">
      <h1 class="text-h3 mb-4">nuxt3_layer</h1>
      <p class="text-body-1 mb-4">
        Standalone-Demo dieses Layers. In Konsumprojekten überschreibst du diese Seite
        einfach mit deiner eigenen <code>pages/index.vue</code> — der Rest des Layers
        (Composables, Components, Middleware, Auth, Vuetify, i18n) wird vererbt.
      </p>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <v-card-title>Auth</v-card-title>
            <v-card-text>
              <p v-if="auth.loggedIn">Eingeloggt als <b>{{ auth.user?.email }}</b></p>
              <p v-else>Nicht angemeldet.</p>
            </v-card-text>
            <v-card-actions>
              <v-btn v-if="!auth.loggedIn" color="primary" to="/crew/login">Login</v-btn>
              <v-btn v-else color="error" @click="logout">Logout</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <v-card-title>Layer-Info</v-card-title>
            <v-card-text>
              <p><b>App:</b> {{ runtime.public.appName }}</p>
              <p><b>API:</b> {{ runtime.public.apiBase || '(nicht gesetzt)' }}</p>
              <p><b>Mode:</b> {{ runtime.public.deployMode }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
const auth = useAuthStore()
const { logout: doLogout } = useAuth()
const runtime = useRuntimeConfig()

async function logout() {
  await doLogout()
}
</script>
