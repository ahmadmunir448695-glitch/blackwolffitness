<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import { programLinks } from '@/config/navigation.js'

const props = defineProps({
  current: { type: String, required: true },
})

const others = computed(() => programLinks.filter((link) => link.to !== `/services/${props.current}`))
</script>

<template>
  <nav class="border-t border-line py-12" aria-labelledby="related-title">
    <div class="site-container">
      <h2 id="related-title" class="text-sm font-semibold text-ash">Other programs</h2>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li v-for="link in others" :key="link.to">
          <RouterLink
            :to="link.to"
            class="soft-round inline-flex items-center gap-2 border border-line px-4 py-2.5 font-medium transition-colors hover:border-ember hover:text-ember"
            :class="link.featured ? 'text-ember' : ''"
          >
            {{ link.shortLabel }}
            <AppIcon name="arrowRight" class="h-4 w-4" />
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
