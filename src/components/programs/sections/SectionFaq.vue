<script setup>
import FaqList from '../../ui/FaqList.vue'

defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
    <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
    <FaqList :items="section.items" />
  </div>
</template>
