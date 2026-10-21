<script setup>
/** Special Kids Training: how families get started (a real sequence). */
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
    <ol class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="(step, i) in section.steps" :key="step.name" class="soft-round relative overflow-hidden bg-coal p-6 pt-16">
        <span
          class="absolute left-6 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff9447] font-display text-lg font-black text-[#0b0b0d]"
          aria-hidden="true"
        >{{ i + 1 }}</span>
        <span class="sr-only">Step {{ i + 1 }}:</span>
        <h3 class="font-display text-2xl font-bold uppercase leading-none">{{ step.name }}</h3>
        <p class="mt-3 leading-relaxed text-ash">{{ step.text }}</p>
      </li>
    </ol>
  </div>
</template>
