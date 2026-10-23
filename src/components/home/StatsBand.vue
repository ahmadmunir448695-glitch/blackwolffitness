<script setup>
import CountUp from '../ui/CountUp.vue'
import { clubFacts } from '@/data/content.js'
</script>

<template>
  <section class="relative isolate overflow-hidden border-b border-line bg-ink" aria-label="The club in numbers">
    <div class="glow-ember pointer-events-none absolute -right-32 -top-48 -z-10 h-[30rem] w-[30rem] opacity-60" aria-hidden="true" />
    <dl v-reveal-stagger class="site-container grid grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(fact, i) in clubFacts"
        :key="fact.label"
        class="group relative flex flex-col border-line py-10 before:mb-6 before:block before:h-[2px] before:w-10 before:bg-ember before:transition-all before:duration-500 hover:before:w-24 lg:py-14"
        :class="[i % 2 ? 'border-l pl-6 sm:pl-10' : 'pr-6', i > 1 ? 'border-t lg:border-t-0' : '', i === 2 ? 'lg:border-l lg:pl-10' : '']"
      >
        <dt class="order-2 mt-3 max-w-[12rem] text-sm font-medium uppercase tracking-[0.14em] text-ash">{{ fact.label }}</dt>
        <dd class="order-1 font-display text-[clamp(3.5rem,7vw,6rem)] font-black leading-none text-bone transition-colors duration-300 group-hover:text-ember">
          <CountUp :value="fact.value" />
        </dd>
      </div>
    </dl>
  </section>
</template>
