import { assignResponseNested } from '~/utils/decoder'

// Nuxt-3-Port von KeyHubs infiniteScrollMixin: paginiertes Nachladen via v-intersect.
//   const { items, pending, scrollable, loadingMore, load, onIntersect }
//     = useInfiniteScroll({ scope: 'backend', path: 'courses' })
//   <div v-intersect="onIntersect" v-show="scrollable" />
export function useInfiniteScroll({ scope = 'backend', path }) {
  const api = useApi()
  const ns = (scope === 'admin' || scope === 'backend') ? api[scope] : api

  const items = ref([])
  const pending = ref(true)
  const page = ref(1)
  const scrollable = ref(false)
  const loadingMore = ref(false)

  async function load() {
    pending.value = true
    items.value = assignResponseNested(await ns.index(path))
    pending.value = false
    setTimeout(() => { scrollable.value = true }, 400)
  }

  async function onIntersect(isIntersecting) {
    if (!isIntersecting || !scrollable.value || loadingMore.value) return
    scrollable.value = false
    loadingMore.value = true
    page.value += 1
    const more = assignResponseNested(await ns.index(`${path}?page=${page.value}`))
    items.value.push(...more)
    loadingMore.value = false
    if (more.length) setTimeout(() => { scrollable.value = true }, 400)
  }

  return { items, pending, page, scrollable, loadingMore, load, onIntersect }
}
