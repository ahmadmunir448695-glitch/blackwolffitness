<script setup>
import { computed } from 'vue'
import ProgramTile from './ProgramTile.vue'

/**
 * Asymmetric program layout: 7/5, then thirds, then gymnastics beside the
 * Special Kids feature. Falls back to an even grid for other counts.
 */
const props = defineProps({
  programs: { type: Array, required: true },
  headingLevel: { type: String, default: 'h3' },
})

const featured = computed(() => props.programs.find((p) => p.featured))
const regular = computed(() => props.programs.filter((p) => !p.featured))

const spans = [
  'lg:col-span-7 lg:min-h-[28rem]',
  'lg:col-span-5 lg:min-h-[28rem]',
  'lg:col-span-4 lg:min-h-[24rem]',
  'lg:col-span-4 lg:min-h-[24rem]',
  'lg:col-span-4 lg:min-h-[24rem]',
  'lg:col-span-5 lg:min-h-[24rem]',
]
const useLayout = computed(() => regular.value.length === 6)
</script>

<template>
  <ul v-reveal-stagger class="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
    <li
      v-for="(program, i) in regular"
      :key="program.slug"
      :class="useLayout ? spans[i] : 'lg:col-span-4'"
    >
      <ProgramTile :program="program" :index="i + 1" :heading-level="headingLevel" />
    </li>
    <li v-if="featured" class="sm:col-span-2" :class="useLayout ? 'lg:col-span-7' : 'lg:col-span-12'">
      <ProgramTile :program="featured" :heading-level="headingLevel" sizes="(min-width: 1024px) 30vw, 100vw" />
    </li>
  </ul>
</template>
