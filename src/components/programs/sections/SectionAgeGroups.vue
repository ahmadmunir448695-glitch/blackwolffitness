<script setup>
import PlaceholderText from '../../ui/PlaceholderText.vue'

defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <div class="max-w-2xl">
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 text-lg text-ash">{{ section.intro }}</p>
    </div>
    <ul class="mt-10 grid gap-px bg-line md:grid-cols-3">
      <li v-for="group in section.groups" :key="group.name" class="bg-ink p-7">
        <h3 class="font-display text-3xl font-black uppercase leading-none">{{ group.name }}</h3>
        <p class="mt-2 text-sm font-semibold text-ember">
          <PlaceholderText :value="group.ages" fallback="Ages: ask the club" hint="set ages in src/data/mock/programs.js" />
        </p>
        <p class="mt-4 leading-relaxed text-ash">{{ group.text }}</p>
      </li>
    </ul>
    <p v-if="section.note" class="mt-5 text-sm text-smoke">{{ section.note }}</p>
  </div>
</template>
