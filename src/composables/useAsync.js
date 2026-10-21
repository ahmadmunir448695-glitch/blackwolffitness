import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'

/**
 * Run an async loader and expose loading / error / data state for the UI.
 *
 *   const { data, loading, error, reload } = useAsync(() => api.coaches.list())
 *   const { data } = useAsync(() => api.programs.get(route.params.slug), { watch: () => route.params.slug })
 *
 * Only the latest call wins, so fast navigation never shows stale results.
 */
export function useAsync(loader, { immediate = true, watch: source, initial = null } = {}) {
  const data = shallowRef(initial)
  const error = shallowRef(null)
  const loading = ref(Boolean(immediate))
  let current = 0
  let controller = null

  async function run(...args) {
    const id = ++current
    controller?.abort()
    controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    loading.value = true
    error.value = null
    try {
      const result = await loader({ signal: controller?.signal }, ...args)
      if (id === current) data.value = result
      return result
    } catch (err) {
      if (id === current && err?.name !== 'AbortError') {
        error.value = err
        data.value = initial
      }
      return undefined
    } finally {
      if (id === current) loading.value = false
    }
  }

  if (source) watch(source, () => run(), { immediate })
  else if (immediate) run()

  onBeforeUnmount(() => controller?.abort())

  return { data, error, loading, run, reload: run }
}
