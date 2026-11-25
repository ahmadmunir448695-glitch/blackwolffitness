<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  icon: { type: String, default: 'info' },
})
</script>

<template>
  <div class="p-card flex flex-col items-center px-6 py-12 text-center">
    <span class="mb-4 flex h-14 w-14 items-center justify-center border border-line text-ember">
      <AppIcon :name="icon" class="h-6 w-6" />
    </span>
    <h3 class="font-display text-2xl uppercase tracking-wide text-bone">{{ title }}</h3>
    <p v-if="message" class="mt-2 max-w-md text-sm text-ash">{{ message }}</p>
    <div v-if="$slots.default" class="mt-6 flex flex-wrap justify-center gap-2"><slot /></div>
  </div>
</template>
