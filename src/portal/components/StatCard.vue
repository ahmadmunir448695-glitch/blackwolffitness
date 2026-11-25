<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '0' },
  hint: { type: String, default: '' },
  icon: { type: String, default: '' },
  to: { type: [String, Object], default: null },
  accent: { type: Boolean, default: false },
})
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to || undefined"
    class="p-card group relative flex flex-col justify-between gap-4 overflow-hidden p-5"
    :class="[to ? 'p-card-hover' : '', accent ? 'border-ember/50' : '']"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{{ label }}</p>
      <span v-if="icon" class="flex h-9 w-9 items-center justify-center border border-line text-ember transition-colors group-hover:border-ember">
        <AppIcon :name="icon" class="h-[1.1rem] w-[1.1rem]" />
      </span>
    </div>
    <div>
      <p class="font-display text-[2.5rem] font-extrabold leading-none text-bone">{{ value }}</p>
      <p v-if="hint" class="mt-2 text-sm text-ash">{{ hint }}</p>
    </div>
    <span class="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
  </component>
</template>
