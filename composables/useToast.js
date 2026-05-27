import { reactive } from 'vue'

// Global, reactive toast queue. The <AppToast> component (mounted in the
// default layout) renders these as Vuetify v-snackbars. Replaces @nuxtjs/toast.
const state = reactive({
  items: [],
})

let nextId = 1

function push(text, type = 'info', opts = {}) {
  const id = nextId++
  const item = {
    id,
    text,
    type,
    timeout: opts.timeout ?? 5000,
    location: opts.location ?? 'top right',
  }
  state.items.push(item)
  if (item.timeout) {
    setTimeout(() => remove(id), item.timeout + 500)
  }
  return id
}

function remove(id) {
  const idx = state.items.findIndex((t) => t.id === id)
  if (idx > -1) state.items.splice(idx, 1)
}

export function useToast() {
  return {
    state,
    show:    (text, opts) => push(text, 'info',    opts),
    info:    (text, opts) => push(text, 'info',    opts),
    success: (text, opts) => push(text, 'success', opts),
    error:   (text, opts) => push(text, 'error',   opts),
    warn:    (text, opts) => push(text, 'warning', opts),
    remove,
  }
}
