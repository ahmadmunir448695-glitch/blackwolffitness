<script setup>
import AppIcon from '../../ui/AppIcon.vue'

/** A progression path — a real sequence, so the stages are numbered. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
    <p v-if="section.intro" class="mt-4 max-w-2xl text-lg text-ash">{{ section.intro }}</p>

    <ol class="mt-10 grid gap-px bg-line md:grid-cols-3">
      <li v-for="(level, i) in section.levels" :key="level.name" class="relative flex flex-col bg-ink p-7">
        <div class="flex items-center gap-3">
          <span class="font-display text-5xl font-black leading-none text-ember">{{ i + 1 }}</span>
          <span class="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <h3 class="mt-5 font-display text-3xl font-extrabold uppercase leading-none">{{ level.name }}</h3>
        <p class="mt-3 text-ash">{{ level.text }}</p>
        <ul class="mt-5 space-y-2 text-[0.95rem]">
          <li v-for="point in level.points" :key="point" class="flex gap-2.5">
            <AppIcon name="check" class="mt-0.5 h-4 w-4 shrink-0 text-ember" />
            <span>{{ point }}</span>
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>
