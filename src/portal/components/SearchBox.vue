<script setup>
/** Debounced search field. v-model updates 300 ms after typing stops. */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search' },
  label: { type: String, default: 'Search' },
})
const emit = defineEmits(['update:modelValue'])

const local = ref(props.modelValue)
let timer = null
watch(local, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', v.trim()), 300)
})
watch(
  () => props.modelValue,
  (v) => {
    if (v !== local.value.trim()) local.value = v
  },
)
</script>

<template>
  <label class="relative block w-full sm:max-w-xs">
    <span class="sr-only">{{ label }}</span>
    <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
    <input v-model="local" type="search" class="p-input pl-9" :placeholder="placeholder" />
  </label>
</template>
