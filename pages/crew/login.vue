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
  console.log('[login] doLogin start', { email: user.email })
  const result = await formEl.value?.validate()
  console.log('[login] validation', result)
  if (result && result.valid === false) return

  error.value = ''
  try {
    const u = await loginLocal(user)
    console.log('[login] success', u)
    toast.success(t('auth.loggedIn'))
    const back = route.query.back ? String(route.query.back) : '/'
    router.push(back)
  } catch (e) {
    console.error('[login] failed', e, e?.data, e?.response)
    const serverMsg =
      e?.data?.error || e?.data?.message || e?.message || t('auth.wrongCredentials')
    error.value = String(serverMsg)
    toast.error(t('auth.loginError'))
  }
}
</script>
