<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * Wraps an API-driven block and shows the right state:
 * loading → #loading slot (skeleton), error → message + retry,
 * empty → #empty slot, otherwise the default slot.
 */
const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: [Object, Error], default: null },
  empty: { type: Boolean, default: false },
  errorTitle: { type: String, default: 'This section could not load' },
  tone: { type: String, default: 'dark' }, // dark | light
})

defineEmits(['retry'])

const errorMessage = computed(() => {
  const err = props.error
  if (!err) return ''
  if (err.code === 'network') return 'Check your internet connection, then try again.'
  if (err.code === 'timeout') return 'The server took too long to respond. Try again in a moment.'
  return err.message || 'Something went wrong while loading. Try again.'
})
</script>

<template>
  <div aria-live="polite" :aria-busy="loading ? 'true' : 'false'">
    <template v-if="loading">
      <slot name="loading">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="n in 3" :key="n" class="skeleton h-48" />
        </div>
      </slot>
      <span class="sr-only">Loading…</span>
    </template>

    <div
      v-else-if="error"
      role="alert"
      class="flex flex-col items-start gap-4 border p-6 sm:flex-row sm:items-center"
      :class="tone === 'light' ? 'border-graphite/20 bg-chalk-2 text-graphite' : 'border-line bg-coal text-bone'"
    >
      <AppIcon name="alert" class="h-6 w-6 shrink-0 text-danger" />
      <div class="flex-1">
        <p class="font-semibold">{{ errorTitle }}</p>
        <p class="mt-1 text-sm" :class="tone === 'light' ? 'text-slate' : 'text-ash'">{{ errorMessage }}</p>
      </div>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 border px-4 text-sm font-semibold transition-colors hover:border-ember hover:text-ember"
        :class="tone === 'light' ? 'border-graphite/30' : 'border-bone/30'"
        @click="$emit('retry')"
      >
        <AppIcon name="refresh" class="h-4 w-4" />
        Try again
      </button>
    </div>

    <template v-else-if="empty">
      <slot name="empty" />
    </template>

    <slot v-else />
  </div>
</template>
