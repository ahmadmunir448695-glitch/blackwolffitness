<script setup>
/** Goal-setting process for General Fitness: a four-step loop. */
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
    <ol class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
      <li v-for="(step, i) in section.steps" :key="step.name" class="relative lg:pr-8">
        <div class="flex items-center">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center bg-ember font-display text-3xl font-black text-ink">{{ i + 1 }}</span>
          <span class="ml-4 hidden h-px flex-1 bg-gradient-to-r from-ember/70 to-line lg:block" aria-hidden="true" />
        </div>
        <h3 class="mt-6 font-display text-2xl font-bold uppercase leading-none">{{ step.name }}</h3>
        <p class="mt-3 leading-relaxed text-ash">{{ step.text }}</p>
      </li>
    </ol>
    <p class="mt-10 text-sm text-smoke">Then the loop starts again, with a new target.</p>
  </div>
</template>
