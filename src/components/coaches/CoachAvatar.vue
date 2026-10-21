<script setup>
import SmartImage from '../ui/SmartImage.vue'
import emblem from '@/assets/brand/wolf-emblem.png'

/** Coach photo, or a branded placeholder portrait while no photo is set. */
defineProps({
  coach: { type: Object, required: true },
  sizes: { type: String, default: '(min-width: 1024px) 25vw, 50vw' },
  priority: { type: Boolean, default: false },
})
</script>

<template>
  <SmartImage
    v-if="coach.photo?.src"
    :image="coach.photo"
    :sizes="sizes"
    :priority="priority"
    position="50% 25%"
  />
  <div
    v-else
    class="relative flex items-end justify-center overflow-hidden bg-gradient-to-b from-iron via-coal to-ink"
    role="img"
    :aria-label="`Photo of ${coach.name || coach.role} coming soon`"
  >
    <div class="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_bottom,rgb(255_148_71/0.22),transparent_65%)] transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60" aria-hidden="true" />
    <img
      :src="emblem"
      alt=""
      class="absolute left-1/2 top-[42%] w-[62%] -translate-x-1/2 -translate-y-1/2 opacity-20 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-45 group-hover:grayscale-0"
    />
    <span class="relative mb-4 border border-bone/10 bg-ink/80 px-2.5 py-1 text-xs font-medium text-ash backdrop-blur">Photo coming soon</span>
  </div>
</template>
