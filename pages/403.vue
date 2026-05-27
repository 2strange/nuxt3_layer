<template>
  <div class="section">
    <div class="corset xs">
      <template v-if="auth.loggedIn">
        <h2 class="text-h5 mb-4">Zugriff verweigert</h2>
        <p class="mb-4">Du bist eingeloggt, aber dir fehlen die nötigen Rechte.</p>
        <v-row justify="center">
          <v-col cols="12" md="6">
            <v-btn block size="large" to="/">Zur Startseite</v-btn>
          </v-col>
        </v-row>
      </template>

      <template v-else>
        <h3 class="text-h5 mb-4 press">Login erforderlich</h3>
        <v-form @submit.prevent="doLogin" ref="formEl">
          <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>

          <v-text-field
            v-model="user.email"
            :rules="emailRules"
            label="Email"
            prepend-inner-icon="mdi-email-outline"
            type="email"
            v-bind="inputStyles"
          />
          <v-text-field
            v-model="user.password"
            :rules="requiredRules"
            label="Passwort"
            prepend-inner-icon="mdi-lock-outline"
            type="password"
            v-bind="inputStyles"
          />

          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <v-btn block color="primary" size="large" :loading="auth.loading" @click="doLogin">login</v-btn>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn block variant="text" color="primary" to="/crew/login">Login-Seite</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const auth = useAuthStore()
const { loginLocal } = useAuth()
const { emailRules, requiredRules, inputStyles } = useFormRules()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const user = reactive({ email: '', password: '' })
const error = ref('')
const formEl = ref(null)

async function doLogin() {
  console.log('[403/login] doLogin start')
  const result = await formEl.value?.validate()
  if (result && result.valid === false) return
  error.value = ''
  try {
    await loginLocal(user)
    toast.success('Du bist angemeldet')
    const back = route.query.back ? String(route.query.back) : '/'
    router.push(back)
  } catch (e) {
    console.error('[403/login] failed', e, e?.data)
    const serverMsg = e?.data?.error || e?.data?.message || e?.message || 'Falsche Zugangsdaten'
    error.value = String(serverMsg)
  }
}
</script>
