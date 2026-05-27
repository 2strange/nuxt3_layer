<template>
  <v-app>
    <v-main>
      <div class="section">
        <div class="corset xs">
          <h1 class="text-h3 mb-4">{{ error.statusCode }}</h1>
          <p class="text-h6 mb-4">{{ message }}</p>
          <v-btn color="primary" @click="handleError">Zur Startseite</v-btn>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
const props = defineProps({ error: Object })

const message = computed(() => {
  if (props.error?.statusCode === 404) return 'Seite nicht gefunden'
  return props.error?.message || 'Ein Fehler ist aufgetreten'
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>
