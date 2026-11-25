/**
 * Helpers shared by the admin pages: server-paged lists whose filters live
 * in the URL query, and the list of championships the user may manage.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../../lib/api.js'
import { toast } from '../../lib/ui.js'

/** Championships the signed-in admin manages (for filters and selects). */
export function useAdminEvents() {
  const events = ref([])
  const loading = ref(true)
  http
    .get('/admin/events')
    .then((res) => (events.value = res.items || []))
    .catch((err) => toast.error(err))
    .finally(() => (loading.value = false))
  return { events, loading }
}

function readQuery(query, defaults) {
  const out = {}
  for (const [k, def] of Object.entries(defaults)) {
    const raw = query[k]
    const v = Array.isArray(raw) ? raw[0] : raw
    if (v === undefined || v === null || v === '') out[k] = def
    else if (typeof def === 'number') out[k] = Number(v) || def
    else out[k] = String(v)
  }
  return out
}

function toQuery(filters, defaults) {
  const q = {}
  for (const [k, v] of Object.entries(filters)) if (v !== '' && v !== null && v !== undefined && v !== defaults[k]) q[k] = String(v)
  return q
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Paged, filterable list backed by `GET path`. Filters (including page,
 * sort and dir) mirror the URL query, so filtered views can be linked to.
 *
 *   const list = usePagedList('/admin/teams', { q: '', eventId: '', page: 1, sort: 'name', dir: 'asc' })
 *   list.filters.q = 'wolf'   // reloads, resets to page 1, updates ?q=wolf
 */
export function usePagedList(path, defaults) {
  const route = useRoute()
  const router = useRouter()
  const currentPath = route.path
  const filters = reactive(readQuery(route.query, defaults))
  const data = ref({ items: [], total: 0, page: 1, pageSize: 25, pages: 1 })
  const loading = ref(true)
  const error = ref('')
  let seq = 0

  async function load() {
    const mine = ++seq
    loading.value = true
    error.value = ''
    try {
      const res = await http.get(path, { ...filters })
      if (mine === seq) data.value = res
    } catch (err) {
      if (mine === seq) {
        error.value = err.message
        toast.error(err)
      }
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  const filterKeys = Object.keys(defaults).filter((k) => k !== 'page')
  watch(
    () => filterKeys.map((k) => filters[k]),
    () => {
      if (filters.page !== 1) filters.page = 1
    },
  )

  watch(
    () => ({ ...filters }),
    () => {
      const q = toQuery(filters, defaults)
      if (!same(q, toQuery(readQuery(route.query, defaults), defaults))) router.replace({ query: q })
      load()
    },
    { deep: true },
  )

  // Navigating to the same page with another query (e.g. a sidebar link) resets the filters.
  watch(
    () => route.query,
    (query) => {
      if (route.path !== currentPath) return
      const next = readQuery(query, defaults)
      if (!same(next, { ...filters })) Object.assign(filters, next)
    },
  )
  const sort = computed(() => ({ key: filters.sort || '', dir: filters.dir || 'desc' }))
  function setSort({ key, dir }) {
    filters.sort = key
    filters.dir = dir
  }

  load()
  return { filters, data, loading, error, load, sort, setSort }
}

/** Parse an audit/history `details` JSON string; returns null when empty. */
export function parseDetails(details) {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return details
  }
}
