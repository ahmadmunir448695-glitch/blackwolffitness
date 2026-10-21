<script setup>
/** Example training week for General Fitness (not a timetable). */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
    <div>
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 max-w-md text-lg text-ash">{{ section.intro }}</p>
      <p v-if="section.note" class="mt-6 inline-block border border-dashed border-line px-3 py-1.5 text-sm text-smoke">{{ section.note }}</p>
    </div>
    <ul class="grid gap-3 md:grid-cols-3">
      <li v-for="day in section.days" :key="day.label" class="flex flex-col bg-ink p-6">
        <p class="text-sm text-smoke">{{ day.label }}</p>
        <h3 class="mt-2 font-display text-3xl font-black uppercase leading-[0.95] text-ember">{{ day.focus }}</h3>
        <p class="mt-4 leading-relaxed text-ash">{{ day.text }}</p>
      </li>
    </ul>
  </div>
</template>
