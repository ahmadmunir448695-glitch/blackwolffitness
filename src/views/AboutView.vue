<script setup>
import { about, gallery } from '@/data/content.js'
import { media } from '@/data/media.js'
import PageIntro from '@/components/shared/PageIntro.vue'
import GalleryGrid from '@/components/shared/GalleryGrid.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import WolfMark from '@/components/brand/WolfMark.vue'

const isDev = import.meta.env.DEV
</script>

<template>
  <div>
    <PageIntro title="About Black Wolf" eyebrow="Our club" :lead="about.intro[0]" :image="media.groupInUniform" />

    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="club-title">
      <div class="site-container grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <h2 id="club-title" class="font-display text-title font-black uppercase">The club</h2>
        <div class="prose-bw text-lg leading-relaxed">
          <p v-for="p in about.intro.slice(1)" :key="p">{{ p }}</p>
          <p v-if="about.story">{{ about.story }}</p>
          <p v-else-if="isDev" class="border border-dashed border-ember/50 p-4 text-base text-smoke">
            Placeholder: add the club’s story (when and why it started, who founded it) in src/data/content.js → about.story.
            This note only appears during development.
          </p>
        </div>
      </div>
    </section>

    <section v-reveal-auto class="border-y border-line bg-coal py-16 lg:py-24" aria-label="Mission and vision">
      <div class="site-container grid lg:grid-cols-2">
        <div class="py-8 lg:py-4 lg:pr-12">
          <h2 class="text-sm font-semibold text-ember">Our mission</h2>
          <p class="mt-4 font-display text-heading font-bold uppercase leading-tight text-bone">{{ about.mission }}</p>
        </div>
        <div class="border-t border-line py-8 lg:border-l lg:border-t-0 lg:py-4 lg:pl-12">
          <h2 class="text-sm font-semibold text-ember">Our vision</h2>
          <p class="mt-4 font-display text-heading font-bold uppercase leading-tight text-bone">{{ about.vision }}</p>
        </div>
      </div>
    </section>

    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="philosophy-title">
      <div class="site-container">
        <h2 id="philosophy-title" class="font-display text-title font-black uppercase">Training philosophy</h2>
        <ul class="mt-10 grid gap-x-10 md:grid-cols-3">
          <li v-for="item in about.philosophy" :key="item.title" class="border-t-2 border-ember py-6">
            <h3 class="font-display text-2xl font-bold uppercase leading-none">{{ item.title }}</h3>
            <p class="mt-3 leading-relaxed text-ash">{{ item.text }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section v-reveal-auto class="relative isolate overflow-hidden border-t border-line py-16 lg:py-24" aria-labelledby="values-title">
      <WolfMark class="absolute -right-24 top-1/2 -z-10 h-[34rem] -translate-y-1/2 text-coal" />
      <div class="site-container">
        <h2 id="values-title" class="font-display text-title font-black uppercase">What we stand for</h2>
        <dl class="mt-10 divide-y divide-line border-y border-line">
          <div v-for="value in about.values" :key="value.name" class="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-baseline sm:gap-10">
            <dt class="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-black uppercase leading-[0.9] text-bone">{{ value.name }}</dt>
            <dd class="text-lg text-ash">{{ value.text }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section v-reveal-auto class="border-t border-line bg-coal py-16 lg:py-24" aria-labelledby="gallery-title">
      <div class="site-container">
        <h2 id="gallery-title" class="font-display text-title font-black uppercase">Training environment</h2>
        <GalleryGrid :items="gallery" class="mt-10" />
      </div>
    </section>

    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="about-cta-title">
      <div class="site-container flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <div class="max-w-2xl">
          <h2 id="about-cta-title" class="font-display text-display font-black uppercase">Find your program</h2>
          <p class="mt-4 text-lg text-ash">Seven programs, from your child’s first movement class to competition preparation.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <BaseButton to="/services" size="lg" icon-right="arrowRight">Explore Our Programs</BaseButton>
          <BaseButton to="/coaches" size="lg" variant="outline">Meet Our Coaches</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
