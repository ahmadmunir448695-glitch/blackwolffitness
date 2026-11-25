<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  back: { type: [String, Object], default: null },
  backLabel: { type: String, default: 'Back' },
})
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
    <div class="min-w-0">
      <RouterLink v-if="back" :to="back" class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-smoke transition-colors hover:text-ember">
        <AppIcon name="arrowLeft" class="h-4 w-4" />
        {{ backLabel }}
      </RouterLink>
      <p v-if="eyebrow" class="eyebrow mb-2">{{ eyebrow }}</p>
      <h1 class="font-display text-[2rem] uppercase leading-none tracking-wide text-bone sm:text-[2.6rem]">{{ title }}</h1>
      <p v-if="subtitle" class="mt-2 max-w-2xl text-[0.95rem] text-ash">{{ subtitle }}</p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
