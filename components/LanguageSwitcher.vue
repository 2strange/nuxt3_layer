<!-- Sprachwechsler (de/en …). Nutzt @nuxtjs/i18n v9 setLocale (Route + Cookie). -->
<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" icon="mdi-translate" :title="current && current.name" />
    </template>
    <v-list density="compact" min-width="160">
      <v-list-item v-for="l in locales" :key="l.code" :active="l.code === locale" @click="choose(l.code)">
        <template #prepend>
          <v-icon :icon="l.code === locale ? 'mdi-check' : 'mdi-web'" />
        </template>
        <v-list-item-title>{{ l.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
const { locale, locales, setLocale } = useI18n()
const current = computed(() => locales.value.find((l) => l.code === locale.value))
function choose(code) { setLocale(code) }
</script>
