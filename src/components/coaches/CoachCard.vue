<script setup>
import { RouterLink } from 'vue-router'
import CoachAvatar from './CoachAvatar.vue'
import AppIcon from '../ui/AppIcon.vue'

defineProps({
  coach: { type: Object, required: true },
  headingLevel: { type: String, default: 'h3' },
  tone: { type: String, default: 'dark' },
})
</script>

<template>
  <article
    class="zoom-hover group relative flex h-full flex-col overflow-hidden border transition-[transform,border-color] duration-300 hover:-translate-y-1.5"
    :class="tone === 'light' ? 'border-transparent bg-chalk-2 text-graphite' : 'border-line bg-coal hover:border-ember/50'"
  >
    <CoachAvatar :coach="coach" class="aspect-[4/5] w-full" />
    <span class="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
    <div class="flex flex-1 flex-col p-5">
      <p class="text-sm font-medium" :class="tone === 'light' ? 'text-rust' : 'text-ember'">{{ coach.role }}</p>
      <component
        :is="headingLevel"
        class="mt-1 font-display text-2xl font-bold uppercase leading-none"
        :class="coach.name ? '' : tone === 'light' ? 'text-slate' : 'text-ash'"
      >
        {{ coach.name || 'Name to be announced' }}
      </component>
      <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Specializations">
        <li
          v-for="tag in coach.specializations"
          :key="tag"
          class="border px-2 py-0.5 text-xs"
          :class="tone === 'light' ? 'border-graphite/25 text-slate' : 'border-line text-ash'"
        >
          {{ tag }}
        </li>
      </ul>
      <RouterLink
        :to="`/coaches/${coach.slug}`"
        class="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold after:absolute after:inset-0 after:content-['']"
        :class="tone === 'light' ? 'text-graphite group-hover:text-rust' : 'text-bone group-hover:text-ember'"
      >
        View profile<span class="sr-only">: {{ coach.name || coach.role }}</span>
        <AppIcon name="arrowRight" class="h-4 w-4" />
      </RouterLink>
    </div>
  </article>
</template>
