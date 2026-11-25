<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 25 },
})
const emit = defineEmits(['update:page'])

const range = computed(() => {
  if (!props.total) return '0 results'
  const from = (props.page - 1) * props.pageSize + 1
  const to = Math.min(props.total, props.page * props.pageSize)
  return `${from}–${to} of ${props.total}`
})
</script>

<template>
  <nav v-if="total" class="mt-4 flex items-center justify-between gap-3 text-sm text-smoke" aria-label="Pagination">
    <p>{{ range }}</p>
    <div class="flex items-center gap-2">
      <button type="button" class="p-icon-btn disabled:opacity-40" :disabled="page <= 1" aria-label="Previous page" @click="emit('update:page', page - 1)">
        <AppIcon name="arrowLeft" class="h-4 w-4" />
      </button>
      <span class="min-w-[4.5rem] text-center text-bone">Page {{ page }} / {{ pages }}</span>
      <button type="button" class="p-icon-btn disabled:opacity-40" :disabled="page >= pages" aria-label="Next page" @click="emit('update:page', page + 1)">
        <AppIcon name="arrowRight" class="h-4 w-4" />
      </button>
    </div>
  </nav>
</template>
