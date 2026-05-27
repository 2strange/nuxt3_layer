<!-- Freundlicher Leer-Zustand (Port von api_frontend_nuxt emptyMSG). i18n-Fallback. -->
<template>
  <div class="text-center text-medium-emphasis pa-8">
    <v-icon v-if="icon" :icon="`mdi-${icon}`" size="48" class="mb-3" />
    <div v-else class="text-h5 mb-3">¯\_(ツ)_/¯</div>
    <p class="text-body-1">{{ message }}</p>
    <slot name="action" />
  </div>
</template>

<script setup>
const props = defineProps({
  msg: { type: String, default: '' },
  model: { type: String, default: '' },
  icon: { type: String, default: '' },
})
const { t } = useI18n()
const message = computed(() =>
  props.msg || (props.model ? t('states.emptyOf', { model: props.model }) : t('states.empty')),
)
</script>
