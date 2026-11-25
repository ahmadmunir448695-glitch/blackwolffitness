<script setup>
/**
 * File picker with drag and drop and client-side type/size checks.
 * Emits `select` with the File; the parent uploads it.
 */
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fmtSize } from '../lib/format.js'

const props = defineProps({
  accept: { type: String, default: 'image/jpeg,image/png,image/webp,application/pdf' },
  maxMb: { type: Number, default: 5 },
  label: { type: String, default: 'Choose a file' },
  hint: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const input = ref(null)
const over = ref(false)
const error = ref('')
const picked = ref(null)

function check(file) {
  error.value = ''
  if (!file) return
  const types = props.accept.split(',').map((t) => t.trim())
  if (!types.includes(file.type)) {
    error.value = 'This file type is not allowed.'
    return
  }
  if (file.size > props.maxMb * 1024 * 1024) {
    error.value = `File is larger than ${props.maxMb} MB.`
    return
  }
  picked.value = file
  emit('select', file)
}

function onChange(e) {
  check(e.target.files?.[0])
  e.target.value = ''
}
function onDrop(e) {
  over.value = false
  check(e.dataTransfer?.files?.[0])
}

const typeHint = () =>
  props.accept
    .split(',')
    .map((t) => t.split('/')[1]?.toUpperCase().replace('JPEG', 'JPG'))
    .join(', ')

defineExpose({ reset: () => (picked.value = null) })
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center gap-3 border border-dashed text-left transition-colors"
      :class="[over ? 'border-ember bg-ember/5' : 'border-line hover:border-ember/70', compact ? 'px-3 py-2.5' : 'px-4 py-5']"
      :disabled="busy"
      @click="input?.click()"
      @dragover.prevent="over = true"
      @dragleave="over = false"
      @drop.prevent="onDrop"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ember">
        <svg v-if="busy" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" /></svg>
        <AppIcon v-else name="plus" class="h-5 w-5" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-bone">{{ busy ? 'Uploading…' : picked ? picked.name : label }}</span>
        <span class="block truncate text-xs text-smoke">{{ picked && !busy ? fmtSize(picked.size) : hint || `${typeHint()} up to ${maxMb} MB · drag and drop works too` }}</span>
      </span>
    </button>
    <input ref="input" type="file" class="sr-only" :accept="accept" tabindex="-1" aria-hidden="true" @change="onChange" />
    <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
  </div>
</template>
