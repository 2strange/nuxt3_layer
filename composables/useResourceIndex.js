import { filterItems } from '~/utils/listFilter'
import { assignResponseNested } from '~/utils/decoder'
import { updateOrAddModel, removeModel } from '~/utils/finder'

// Nuxt-3-Port von KeyHubs indexItemsMixin: Index laden, filtern, Liste pflegen.
//   const { items, pending, filter, filteredItems, load, savedItem, deletedItem }
//     = useResourceIndex({ scope: 'admin', path: 'departments', filterFields: ['name','slug'] })
export function useResourceIndex({ scope = 'backend', path, filterFields = ['name', 'description'] }) {
  const api = useApi()
  const ns = (scope === 'admin' || scope === 'backend') ? api[scope] : api

  const items = ref([])
  const pending = ref(true)
  const error = ref(null)
  const filter = reactive({ query: '', states: [] })

  const filteredItems = computed(() => filterItems(items.value, filter, filterFields))

  async function load() {
    pending.value = true
    error.value = null
    try {
      items.value = assignResponseNested(await ns.index(path))
    } catch (e) {
      error.value = e
    } finally {
      pending.value = false
    }
  }

  function savedItem(model) { updateOrAddModel(items.value, model) }
  function deletedItem(model) { removeModel(items.value, model) }

  return { items, pending, error, filter, filteredItems, load, savedItem, deletedItem }
}
