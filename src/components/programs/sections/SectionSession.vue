<script setup>
/** "How a session runs" — an ordered timeline. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
    <div>
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 max-w-md text-lg text-ash">{{ section.intro }}</p>
    </div>
    <ol class="relative">
      <li v-for="(step, i) in section.steps" :key="step.name" class="relative grid grid-cols-[3rem_1fr] gap-4 pb-8 last:pb-0">
        <span
          v-if="i < section.steps.length - 1"
          class="absolute left-[1.45rem] top-12 bottom-0 w-px bg-line"
          aria-hidden="true"
        />
        <span class="soft-round relative flex h-12 w-12 items-center justify-center border border-ember font-display text-xl font-black text-ember">
          {{ i + 1 }}
        </span>
        <div class="pt-2.5">
          <h3 class="font-display text-2xl font-bold uppercase leading-none">{{ step.name }}</h3>
          <p class="mt-2 leading-relaxed text-ash">{{ step.text }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>
