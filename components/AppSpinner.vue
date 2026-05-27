<!-- Zentraler Lade-Spinner (Nuxt-3/Vuetify-3-Port von api_frontend_nuxt appSpinner). -->
<template>
  <div class="text-center pa-8">
    <v-progress-circular indeterminate :size="size" :width="width" :color="color" />
    <div v-if="text" class="text-medium-emphasis mt-3">{{ text }}</div>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  size: { type: [Number, String], default: 48 },
  width: { type: [Number, String], default: 4 },
  color: { type: String, default: 'primary' },
})
</script>
