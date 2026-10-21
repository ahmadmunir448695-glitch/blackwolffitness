<script setup>
/**
 * Shows a value from config/data, or a clearly marked placeholder when the
 * club has not supplied it yet. In development the hint says which file to
 * edit; on the live site only the friendly fallback is shown.
 */
defineProps({
  value: { type: [String, Number], default: '' },
  fallback: { type: String, default: 'To be announced' },
  hint: { type: String, default: '' },
})

const isDev = import.meta.env.DEV
</script>

<template>
  <span v-if="value !== '' && value !== null && value !== undefined">{{ value }}</span>
  <span v-else class="placeholder-text" :title="isDev && hint ? `Placeholder — ${hint}` : undefined">
    {{ fallback }}<span v-if="isDev && hint" class="sr-only"> (placeholder: {{ hint }})</span>
  </span>
</template>
