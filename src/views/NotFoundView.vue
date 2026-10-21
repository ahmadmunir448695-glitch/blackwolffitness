<script setup>
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import ClawMarks from '@/components/brand/ClawMarks.vue'
import { programLinks } from '@/config/navigation.js'
</script>

<template>
  <section class="relative isolate overflow-hidden" aria-labelledby="nf-title">
    <ClawMarks class="pointer-events-none absolute -right-16 top-6 -z-10 h-[85%] text-iron sm:right-10" />
    <div class="site-container py-20 lg:py-32">
      <p class="font-display text-[clamp(6rem,22vw,16rem)] font-black leading-[0.8] text-ember">404</p>
      <h1 id="nf-title" class="mt-6 font-display text-title font-black uppercase">This page went off the trail</h1>
      <p class="mt-5 max-w-xl text-lg text-ash">
        The address may be mistyped, or the page has moved. Head back home, or jump straight to a program.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <BaseButton to="/" size="lg" icon="arrowLeft">Back to home</BaseButton>
        <BaseButton to="/contact" size="lg" variant="outline">Contact the club</BaseButton>
      </div>
      <ul class="mt-12 flex flex-wrap gap-x-6 gap-y-2">
        <li v-for="link in programLinks" :key="link.to">
          <RouterLink :to="link.to" class="text-ash underline decoration-line underline-offset-4 hover:text-ember">{{ link.shortLabel }}</RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
