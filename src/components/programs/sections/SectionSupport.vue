<script setup>
import AppIcon from '../../ui/AppIcon.vue'

/** Special Kids Training: how Individualized Support works. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <div class="soft-round grid gap-10 bg-coal p-7 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:p-14">
      <div>
        <AppIcon name="heart" class="h-9 w-9 text-ember" />
        <h2 :id="headingId" class="mt-5 font-display text-title font-black uppercase">{{ section.heading }}</h2>
        <div class="prose-bw mt-6 text-lg leading-relaxed">
          <p v-for="p in section.paragraphs" :key="p">{{ p }}</p>
        </div>
      </div>
      <ul class="space-y-3 self-center">
        <li v-for="point in section.points" :key="point" class="soft-round flex items-start gap-3 bg-ink p-4 font-medium">
          <AppIcon name="check" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
          {{ point }}
        </li>
      </ul>
    </div>
  </div>
</template>
