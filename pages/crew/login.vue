<template>
  <div class="section sctn-xxl">
    <div class="corset xs">
      <v-card class="pa-6">
        <h3 class="text-h5 mb-4 press">{{ $t('auth.loginTitle') }}</h3>

        <v-alert v-if="error" type="error" class="mb-3" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="formEl">
          <v-text-field
            v-model="user.email"
            :rules="emailRules"
            :label="$t('auth.email')"
            prepend-inner-icon="mdi-email-outline"
            type="email"
            autocomplete="email"
            v-bind="inputStyles"
          />
          <v-text-field
            v-model="user.password"
            :rules="requiredRules"
            :label="$t('auth.password')"
            prepend-inner-icon="mdi-lock-outline"
            type="password"
            autocomplete="current-password"
            v-bind="inputStyles"
          />

          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <v-btn
                block
                color="primary"
                size="large"
                :loading="auth.loading"
                @click="doLogin"
              >
                {{ $t('auth.loginButton') }}
              </v-btn>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn block variant="text" color="primary" to="/">Zurück</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { log } from '~/services/log'

definePageMeta({ middleware: 'guest' })

const auth = useAuthStore()
const { loginLocal } = useAuth()
const toast = useToast()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
// passRules wären für *Passwort setzen* (>=8 Zeichen). Beim Login nur required.
const { emailRules, requiredRules, inputStyles } = useFormRules()

const user = reactive({ email: '', password: '' })
const error = ref('')
const formEl = ref(null)

async function doLogin() {
  log.info('[login] doLogin start') // no email (PII)
  const result = await formEl.value?.validate()
  log.debug('[login] validation', result?.valid)
  if (result && result.valid === false) return

  error.value = ''
  try {
    await loginLocal(user)
    log.info('[login] success') // never log the user object
    toast.success(t('auth.loggedIn'))
    const back = route.query.back ? String(route.query.back) : '/'
    router.push(back)
  } catch (e) {
    log.warn('[login] failed:', e?.message || String(e)) // never log e.data/e.response (may echo secrets)
    const serverMsg =
      e?.data?.error || e?.data?.message || e?.message || t('auth.wrongCredentials')
    error.value = String(serverMsg)
    toast.error(t('auth.loginError'))
  }
}
</script>
