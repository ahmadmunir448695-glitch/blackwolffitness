<script setup>
import SmartImage from '../ui/SmartImage.vue'
import ClawMarks from '../brand/ClawMarks.vue'
import { media } from '@/data/media.js'
import { about } from '@/data/content.js'

/** Full-bleed photo band with the club's values, the photo drifting behind. */
const words = about.values.slice(0, 3).map((v) => v.name)
</script>

<template>
  <section class="relative isolate overflow-hidden py-28 lg:py-40" aria-labelledby="values-band-title">
    <div v-parallax="0.18" class="absolute -inset-y-[18%] inset-x-0 -z-20">
      <SmartImage :image="media.ringTraining" alt="" sizes="100vw" :widths="[640, 1080, 1600, 2200]" position="50% 40%" class="h-full w-full" img-class="grayscale-[35%]" />
    </div>
    <div class="absolute inset-0 -z-10 bg-ink/75" aria-hidden="true" />
    <div class="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-transparent to-ink" aria-hidden="true" />
    <ClawMarks class="pointer-events-none absolute -left-10 top-1/2 -z-10 hidden h-[80%] -translate-y-1/2 -scale-x-100 text-ember/15 md:block" />

    <div class="site-container text-center">
      <p v-reveal class="eyebrow justify-center">What every session is built on</p>
      <h2 id="values-band-title" class="mt-8 font-display text-[clamp(3.4rem,10vw,9rem)] font-black uppercase leading-[0.86]">
        <span v-for="(word, i) in words" :key="word" v-reveal="{ variant: 'blur', delay: i * 140 }" class="block" :class="i === 1 ? 'text-outline-ember' : 'text-bone'">
          {{ word }}<span class="text-ember">.</span>
        </span>
      </h2>
      <p v-reveal="{ delay: 400 }" class="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-ash">
        Hard training only works when it is coached well and done with respect. That is the standard in every class, at every level.
      </p>
    </div>
  </section>
</template>
