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
              <p><b>Site-URL:</b> {{ runtime.public.siteUrl || '(nicht gesetzt)' }}</p>
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

// --- SEO + JSON-LD demo (combined pattern) -------------------------------
// ONE useSeo() + useJsonLd() block, the way keyhub's buildHead + buildJsonLD
// ran together. All data flows from app.config (jsonLD defaults + company.*) +
// runtimeConfig (siteUrl/appName) — nothing project-specific is hardcoded.
//
// STRONG DEFAULTS: even with zero per-page data, useSeo emits a full OG card
// (default title/description/og:image from the jsonLD[locale] block) and the
// org()/website() builders below read that same block — so every route ships a
// complete @graph. Pages override single fields as needed.
const { CONFIG } = useConfig()

// useSeo returns reactive refs (siteUrl is a ComputedRef → use .value below).
const { siteUrl } = useSeo({
  title: 'Start',
  description: `Standalone-Demo des nuxt3_layer für ${CONFIG('appName')}.`,
  // image: { url: '/og/start.png', width: 1200, height: 630 }, // else default OG image
})

// Static @graph: org + website come straight from the jsonLD config block
// (no args needed). Cross-@id wiring (logo↔org, website→publisher) is internal.
useJsonLd([
  useJsonLd.organization(),
  useJsonLd.website(),
  useJsonLd.webPage({ url: `${siteUrl.value}${useRoute().path}`, name: 'Start' }),
])

// --- Dynamic article example (reactive) ----------------------------------
// On a content/article route you'd pass GETTERS so the head + @graph follow the
// async-loaded data. useSeo reads the getters reactively; useJsonLd takes a
// function and re-renders when `article` resolves:
//
//   const { data: article } = await useFetch(`/api/articles/${route.params.slug}`)
//   useSeo({
//     title:         () => article.value?.title,
//     description:   () => article.value?.excerpt,
//     image:         () => article.value?.ogImage,
//     datePublished: () => article.value?.publishedAt,  // → og:type=article + article:published_time
//     dateModified:  () => article.value?.updatedAt,
//   })
//   useJsonLd(() => {
//     const a = article.value
//     if (!a) return []
//     const url = `${siteUrl.value}${useRoute().path}`
//     return [
//       useJsonLd.webPage({ url, name: a.title, description: a.excerpt,
//                           datePublished: a.publishedAt, dateModified: a.updatedAt,
//                           breadcrumb: true, primaryImage: true }),
//       useJsonLd.breadcrumbList({ pageUrl: url, items: [
//         { name: 'Start', item: `${siteUrl.value}/` }, { name: a.title } ] }),
//     ]
//   })
</script>
