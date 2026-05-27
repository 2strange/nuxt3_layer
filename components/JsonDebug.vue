<!-- Dev-only JSON-Inspektor (Port von api_frontend_nuxt jsonDebug). Nuxt 3 + vue-json-pretty. -->
<template>
  <ClientOnly>
    <div v-if="!isProd" class="my-2">
      <v-btn block variant="tonal" color="blue-grey" size="small" @click="show = !show">
        &lt;JSON&gt;&nbsp; {{ label }} &nbsp;&lt;JSON&gt;
      </v-btn>
      <v-expand-transition>
        <div v-show="show" class="pa-2" style="background:#0f172a; overflow:auto; border-radius:4px;">
          <VueJsonPretty :data="json" :deep="deep" :show-length="true" :show-double-quotes="false" />
        </div>
      </v-expand-transition>
    </div>
  </ClientOnly>
</template>

<script setup>
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

defineProps({
  label: { type: String, default: 'json' },
  json: { type: [Object, Array, String, Boolean, Number], default: () => ({}) },
  deep: { type: Number, default: 1 },
})

const show = ref(false)
const config = useRuntimeConfig()
const isProd = computed(() => String(config.public.deployMode).includes('prod'))
</script>
