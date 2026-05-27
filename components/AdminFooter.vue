<!-- Minimaler Admin-Footer (an KeyHub adminFooter angelehnt). -->
<template>
  <v-footer color="transparent" class="text-caption text-medium-emphasis d-flex justify-space-between px-4">
    <span>{{ appName }} · Admin</span>
    <span>© {{ year }}</span>
  </v-footer>
</template>

<script setup>
const config = useRuntimeConfig()
const appName = config.public.appName
const year = new Date().getFullYear()
</script>
