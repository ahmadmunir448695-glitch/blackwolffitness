<script setup>
/** Gymnastics skill ladder: stages rise left to right like steps. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})

const offsets = ['lg:mt-24', 'lg:mt-12', 'lg:mt-0']
</script>

<template>
  <div class="site-container">
    <div class="max-w-2xl">
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 text-lg text-ash">{{ section.intro }}</p>
    </div>
    <ol class="mt-12 grid gap-3 lg:grid-cols-3 lg:items-start">
      <li
        v-for="(rung, i) in section.rungs"
        :key="rung.stage"
        class="border-t-4 border-ember bg-ink p-7"
        :class="offsets[i] ?? ''"
      >
        <p class="text-sm font-semibold text-ember">Step {{ i + 1 }} of {{ section.rungs.length }}</p>
        <h3 class="mt-2 font-display text-3xl font-black uppercase leading-none">{{ rung.stage }}</h3>
        <p class="mt-3 text-ash">{{ rung.text }}</p>
        <ul class="mt-5 grid grid-cols-1 gap-px bg-line">
          <li v-for="skill in rung.skills" :key="skill" class="bg-coal px-4 py-3 text-[0.95rem] font-medium">{{ skill }}</li>
        </ul>
      </li>
    </ol>
    <p v-if="section.note" class="mt-6 max-w-3xl text-sm text-smoke">{{ section.note }}</p>
  </div>
</template>
