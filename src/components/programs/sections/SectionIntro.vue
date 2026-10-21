<script setup>
import SmartImage from '../../ui/SmartImage.vue'
import AppIcon from '../../ui/AppIcon.vue'

defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20">
    <div>
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <div class="prose-bw mt-6 text-lg leading-relaxed">
        <p v-for="p in section.paragraphs" :key="p">{{ p }}</p>
      </div>
      <aside v-if="section.disclaimer" class="soft-round mt-8 flex max-w-2xl gap-3 border-l-4 border-ember bg-coal p-5">
        <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
        <p class="text-[0.95rem] leading-relaxed text-ash">{{ section.disclaimer }}</p>
      </aside>
    </div>
    <SmartImage
      v-if="section.image"
      :image="section.image"
      sizes="(min-width: 1024px) 40vw, 100vw"
      class="cut-corner-lg soft-round aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]"
    />
  </div>
</template>
