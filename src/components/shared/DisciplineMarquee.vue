<script setup>
/**
 * Two angled ribbons of discipline names scrolling in opposite directions.
 * Decorative only: the same names are links elsewhere on the page.
 */
defineProps({
  words: {
    type: Array,
    default: () => ['Taekwondo', 'Boxing', 'Kickboxing', 'MMA', 'Fitness', 'Gymnastics', 'Special Kids'],
  },
})
</script>

<template>
  <div class="relative isolate overflow-hidden py-10 lg:py-14" aria-hidden="true">
    <div class="marquee -mx-4 -rotate-2 bg-ember py-3 text-ink">
      <div class="marquee-track" style="--marquee-speed: 38s">
        <div v-for="copy in 2" :key="copy" class="flex shrink-0 items-center">
          <span v-for="word in words" :key="word" class="flex items-center font-display text-4xl font-black uppercase sm:text-5xl">
            <span class="px-6">{{ word }}</span>
            <svg viewBox="0 0 24 24" class="h-6 w-6 shrink-0" fill="currentColor"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>
          </span>
        </div>
      </div>
    </div>
    <div class="marquee -mx-4 -mt-1 rotate-1 border-y border-line bg-ink py-3">
      <div class="marquee-track is-reverse" style="--marquee-speed: 46s">
        <div v-for="copy in 2" :key="copy" class="flex shrink-0 items-center">
          <span v-for="word in words" :key="word" class="flex items-center font-display text-4xl font-black uppercase text-bone/80 sm:text-5xl">
            <span class="text-outline px-6">{{ word }}</span>
            <span class="h-2 w-2 shrink-0 rotate-45 bg-ember" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
