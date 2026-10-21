<script setup>
import SmartImage from '../../ui/SmartImage.vue'
import AppIcon from '../../ui/AppIcon.vue'

/** Image-led feature block with supporting points. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
    <SmartImage
      v-if="section.image"
      :image="section.image"
      sizes="(min-width: 1024px) 45vw, 100vw"
      class="cut-corner-lg soft-round aspect-[4/3]"
    />
    <div>
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <div class="prose-bw mt-6 text-lg leading-relaxed">
        <p v-for="p in section.paragraphs" :key="p">{{ p }}</p>
      </div>
      <ul v-if="section.points?.length" class="mt-8 space-y-3">
        <li v-for="point in section.points" :key="point" class="flex gap-3 font-medium">
          <AppIcon name="check" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
          {{ point }}
        </li>
      </ul>
    </div>
  </div>
</template>
