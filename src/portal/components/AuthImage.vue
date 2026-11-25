<script setup>
/** Image that needs the sign-in token (athlete photos are private). */
import { onBeforeUnmount, ref, watch } from 'vue'
import { imageUrl } from '../lib/api.js'
import { initials } from '../lib/format.js'

const props = defineProps({
  src: { type: String, default: '' }, // API path, e.g. /athletes/3/photo
  name: { type: String, default: '' },
  version: { type: [String, Number], default: 0 },
  sizeClass: { type: String, default: 'h-12 w-12' },
})

const url = ref('')
async function load() {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
  if (!props.src) return
  try {
    url.value = await imageUrl(props.src)
  } catch {
    url.value = ''
  }
}
watch(() => [props.src, props.version], load, { immediate: true })
onBeforeUnmount(() => url.value && URL.revokeObjectURL(url.value))
</script>

<template>
  <span class="relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-iron" :class="sizeClass">
    <img v-if="url" :src="url" :alt="name ? `Photo of ${name}` : ''" class="h-full w-full object-cover" />
    <span v-else class="font-display text-lg font-bold text-ash" aria-hidden="true">{{ initials(name) }}</span>
  </span>
</template>
