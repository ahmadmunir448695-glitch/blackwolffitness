<script setup>
import { whyBlackWolf } from '@/data/content.js'
import { media } from '@/data/media.js'
import BaseButton from '../ui/BaseButton.vue'
import SmartImage from '../ui/SmartImage.vue'

const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <section class="relative isolate overflow-hidden border-y border-line bg-ink py-20 lg:py-32" aria-labelledby="why-title">
    <span
      class="text-outline pointer-events-none absolute -right-8 top-6 -z-10 select-none font-display text-[clamp(8rem,22vw,20rem)] font-black uppercase leading-none text-bone/[0.06]"
      aria-hidden="true"
    >Pack</span>

    <div class="site-container grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
      <!-- Heading + photo collage -->
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p v-reveal class="eyebrow">Why Black Wolf</p>
        <h2 id="why-title" v-reveal="{ delay: 80 }" class="mt-5 font-display text-display font-black uppercase">
          Why train with <span class="text-ember">Black Wolf?</span>
        </h2>
        <p v-reveal="{ delay: 160 }" class="mt-5 max-w-md text-lg leading-relaxed text-ash">
          Hard training only works when it is coached well. Here is what you can expect from your first session onward.
        </p>

        <div class="relative mt-10 mr-8 sm:mr-16">
          <div v-reveal="'clip'">
            <div>
              <div class="cut-corner-lg zoom-hover relative aspect-[4/3] overflow-hidden">
                <SmartImage :image="media.heavyBag" sizes="(min-width: 1024px) 40vw, 90vw" class="h-full w-full" />
                <div class="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div
            v-reveal="{ variant: 'scale', delay: 300 }"
            class="absolute -bottom-8 -right-8 w-[42%] border-4 border-coal shadow-2xl shadow-black/60 sm:-right-16"
          >
            <div class="anim-float" style="--r: 2deg">
              <SmartImage :image="media.boxingGloveRed" sizes="(min-width: 1024px) 18vw, 40vw" :widths="[320, 480, 768]" class="aspect-square" />
            </div>
          </div>
        </div>

        <BaseButton v-reveal to="/about" variant="ghost" class="mt-16" icon-right="arrowRight">Our training philosophy</BaseButton>
      </div>

      <!-- Reasons -->
      <ol v-reveal-stagger class="grid content-start gap-3 sm:grid-cols-2">
        <li
          v-for="(item, i) in whyBlackWolf"
          :key="item.title"
          class="fx-spot group relative overflow-hidden border border-line bg-ink/60 p-7 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-ember/60 hover:bg-ink"
        >
          <span
            class="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100"
            aria-hidden="true"
          />
          <span class="font-display text-5xl font-black leading-none text-ember transition-colors duration-300 group-hover:text-ember" aria-hidden="true">
            {{ pad(i + 1) }}
          </span>
          <h3 class="mt-5 font-display text-2xl font-bold uppercase leading-none text-bone">{{ item.title }}</h3>
          <p class="mt-3 leading-relaxed text-ash">{{ item.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
