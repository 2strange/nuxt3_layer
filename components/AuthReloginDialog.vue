<template>
  <v-dialog :model-value="state.open" persistent max-width="440">
    <v-card class="pa-4">
      <v-card-title class="text-h6">{{ $t('auth.reloginTitle') }}</v-card-title>
      <v-card-text>
        <p class="mb-4">{{ state.reason === 'expired' ? $t('auth.reloginExpired') : $t('auth.reloginText') }}</p>
        <v-alert v-if="error" type="error" density="compact" class="mb-3">{{ error }}</v-alert>
        <v-form ref="formEl" @submit.prevent="submit">
          <v-text-field v-model="form.email" :rules="emailRules" :label="$t('auth.email')" prepend-inner-icon="mdi-email-outline" type="email" autocomplete="email" v-bind="inputStyles" />
          <v-text-field v-model="form.password" :rules="requiredRules" :label="$t('auth.password')" prepend-inner-icon="mdi-lock-outline" type="password" autocomplete="current-password" autofocus v-bind="inputStyles" />
          <v-btn type="submit" block color="primary" size="large" class="mt-2" :loading="auth.loading">{{ $t('auth.reloginButton') }}</v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="giveUp">{{ $t('auth.reloginLogout') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// Re-login IN PLACE (v0.5.0): sits over the page when the session expired or a
// request got a 401, so in-memory work (forms, signatures) survives. Waiting
// requests are retried after the SAME user signed in again. Mount it once per
// layout (the layer layouts do); without it the old 401 redirect stays active.
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { authConfig, finishRelogin, reloginState } from '~/utils/authSession'

const state = reloginState
const auth = useAuthStore()
const { reloginLocal } = useAuth()
const { emailRules, requiredRules, inputStyles } = useFormRules()
const { t } = useI18n()
const route = useRoute()
const appConfig = useAppConfig()

const form = reactive({ email: '', password: '' })
const error = ref('')
const formEl = ref(null)

watch(() => state.open, (open) => {
  if (!open) return
  error.value = ''
  form.password = ''
  form.email = auth.user?.email || form.email
})

async function submit() {
  const result = await formEl.value?.validate()
  if (result && result.valid === false) return
  error.value = ''
  try {
    const who = await reloginLocal(form)
    form.password = ''
    if (who === 'same') {
      finishRelogin(true)
    } else {
      // Another account: never send the previous user's pending work under it.
      finishRelogin(false)
      window.location.assign('/')
    }
  } catch (e) {
    error.value = String(e?.data?.error || e?.data?.message || t('auth.wrongCredentials'))
  }
}

function giveUp() {
  finishRelogin(false)
  auth.reset()
  navigateTo({ path: authConfig(appConfig).loginPath, query: { back: route.fullPath } })
}

onMounted(() => { state.mounted++ })
onBeforeUnmount(() => { state.mounted-- })
</script>
