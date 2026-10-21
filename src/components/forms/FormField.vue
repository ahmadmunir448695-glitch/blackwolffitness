<script setup>
/**
 * Label + control + hint + error, wired for screen readers.
 * The slot receives { id, describedby, invalid } to bind onto the control.
 */
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  optional: { type: Boolean, default: false },
})

const describedby = () =>
  [props.hint ? `${props.id}-hint` : '', props.error ? `${props.id}-error` : ''].filter(Boolean).join(' ') || undefined
</script>

<template>
  <div>
    <label :for="id" class="flex items-baseline justify-between gap-3 text-sm font-semibold text-bone">
      <span>{{ label }}</span>
      <span v-if="optional" class="text-xs font-normal text-smoke">Optional</span>
    </label>
    <p v-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-smoke">{{ hint }}</p>
    <div class="mt-2">
      <slot :id="id" :describedby="describedby()" :invalid="Boolean(error)" />
    </div>
    <p v-if="error" :id="`${id}-error`" class="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
      <svg viewBox="0 0 16 16" class="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path d="M8 1.5 15 14H1L8 1.5Zm-.75 4.75v3.5h1.5v-3.5h-1.5Zm0 4.75v1.5h1.5V11h-1.5Z" /></svg>
      {{ error }}
    </p>
  </div>
</template>
