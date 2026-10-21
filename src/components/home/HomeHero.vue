<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SmartImage from '../ui/SmartImage.vue'
import BaseButton from '../ui/BaseButton.vue'
import ClawMarks from '../brand/ClawMarks.vue'
import { heroSlides } from '@/data/content.js'
import { programLinks } from '@/config/navigation.js'

/**
 * Home hero: a slow cross-fading slideshow (one photo per discipline) with a
 * Ken Burns drift, the torn-in claw marks and the headline rising line by line.
 * Autoplay stops for reduced-motion visitors and while the tab is hidden.
 */
const SLIDE_MS = 6500
const lines = ['Unleash', 'your inner']
const active = ref(0)
const previous = ref(-1) // keeps its Ken Burns drift while fading out
const paused = ref(false)
let timer = null

const current = computed(() => heroSlides[active.value])
const pad = (n) => String(n).padStart(2, '0')

function show(i) {
  if (i === active.value) return
  previous.value = active.value
  active.value = (i + heroSlides.length) % heroSlides.length
}
function go(i) {
  show(i)
  restart()
}
function restart() {
  clearInterval(timer)
  if (paused.value) return
  timer = setInterval(() => show(active.value + 1), SLIDE_MS)
}
function onVisibility() {
  if (document.hidden) clearInterval(timer)
  else restart()
}

onMounted(() => {
  paused.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  restart()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <section class="relative isolate overflow-hidden" aria-labelledby="hero-title">
    <!-- Slides -->
    <div class="absolute inset-0 -z-20" aria-hidden="true">
      <div
        v-for="(slide, i) in heroSlides"
        :key="slide.label"
        class="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        :class="i === active ? 'opacity-100' : 'opacity-0'"
      >
        <SmartImage
          :image="slide.image"
          :priority="i === 0"
          alt=""
          sizes="100vw"
          :widths="[640, 960, 1280, 1600, 2200]"
          :position="slide.position"
          :img-class="i === active || i === previous ? 'anim-kenburns' : ''"
          class="absolute inset-0 h-full w-full"
        />
      </div>
    </div>

    <!-- Light and shade -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/75 to-ink/5" aria-hidden="true" />
    <div class="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink via-ink/60 to-transparent" aria-hidden="true" />
    <div class="glow-ember anim-glow pointer-events-none absolute -bottom-40 -left-40 -z-10 h-[38rem] w-[38rem]" aria-hidden="true" />

    <ClawMarks
      animate
      :delay="0.75"
      class="pointer-events-none absolute -right-16 top-[8%] -z-10 hidden h-[62%] text-ember/85 drop-shadow-[0_0_30px_rgb(255_148_71/0.45)] md:block lg:right-[4%]"
    />

    <!-- Vertical side label + scroll cue -->
    <div class="pointer-events-none absolute bottom-28 right-6 hidden flex-col items-center gap-4 xl:flex" aria-hidden="true">
      <span class="text-[0.7rem] font-semibold tracking-[0.4em] text-ash [writing-mode:vertical-rl]">SCROLL</span>
      <span class="relative h-16 w-px overflow-hidden bg-bone/15">
        <span class="absolute inset-x-0 top-0 h-1/2 bg-ember [animation:bw-scroll-cue_2.2s_ease-in-out_infinite]" />
      </span>
    </div>

    <div class="site-container flex min-h-[calc(100svh-4.5rem)] flex-col justify-end pb-10 pt-16 lg:pb-12">
      <p class="eyebrow anim-fade mb-5" style="animation-delay: 0.05s">Black Wolf Fitness Club</p>

      <h1 id="hero-title" class="font-display text-[clamp(3.4rem,9.6vw,8.75rem)] leading-[0.86] font-black uppercase text-bone text-shadow-hero">
        <span class="sr-only">Unleash your inner wolf</span>
        <span v-for="(line, i) in lines" :key="line" class="block overflow-hidden pb-[0.04em]" aria-hidden="true">
          <span class="anim-rise block" :style="{ animationDelay: `${0.1 + i * 0.11}s` }">{{ line }}</span>
        </span>
        <span class="block overflow-hidden pb-[0.04em]" aria-hidden="true">
          <span class="anim-rise inline-block" style="animation-delay: 0.32s">
            <span class="text-gradient-ember [text-shadow:none]">wolf</span><span class="text-ember">.</span>
          </span>
        </span>
      </h1>

      <div class="anim-fade-up mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" style="animation-delay: 0.55s">
        <div class="max-w-xl">
          <p class="font-display text-2xl font-bold uppercase tracking-wide text-bone sm:text-3xl">
            Train Strong. <span class="text-ember">Fight Smart.</span> Become Unstoppable.
          </p>
          <p class="mt-4 text-lg leading-relaxed text-ash">
            Black Wolf Fitness Club is home to coached Taekwondo, Boxing, Kickboxing, MMA, fitness and gymnastics training,
            plus a dedicated Special Kids Training program. Start as a beginner. Leave stronger.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <BaseButton to="/services" size="lg" icon-right="arrowRight">Explore Our Programs</BaseButton>
            <BaseButton to="/coaches" size="lg" variant="outline">Meet Our Coaches</BaseButton>
          </div>
        </div>

        <!-- Slide controls -->
        <div class="w-full max-w-xs lg:mb-1 lg:justify-self-end">
          <div class="flex items-baseline justify-between gap-4">
            <p class="font-display text-5xl font-black leading-none text-bone">
              {{ pad(active + 1) }}<span class="text-2xl text-smoke"> / {{ pad(heroSlides.length) }}</span>
            </p>
            <RouterLink :to="current.to" class="text-sm font-semibold uppercase tracking-[0.2em] text-ember hover:text-ember-hi">
              {{ current.label }} →
            </RouterLink>
          </div>
          <div class="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Hero photos">
            <button
              v-for="(slide, i) in heroSlides"
              :key="slide.label"
              type="button"
              class="group relative h-6"
              :aria-label="`Show ${slide.label} photo`"
              :aria-pressed="i === active ? 'true' : 'false'"
              @click="go(i)"
            >
              <span class="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden bg-bone/20 transition-colors group-hover:bg-bone/40">
                <span
                  v-if="i === active"
                  :key="`p-${active}`"
                  class="absolute inset-0 origin-left bg-ember"
                  :style="paused ? '' : `animation: bw-progress ${SLIDE_MS}ms linear both`"
                />
                <span v-else-if="i < active" class="absolute inset-0 bg-bone/60" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <nav aria-label="Programs" class="anim-fade relative border-t border-bone/10 bg-ink/70 backdrop-blur" style="animation-delay: 0.7s">
      <ul class="site-container no-scrollbar flex gap-x-10 overflow-x-auto py-4 text-sm">
        <li v-for="link in programLinks" :key="link.to" class="shrink-0">
          <RouterLink
            :to="link.to"
            class="group relative inline-block py-1 font-medium transition-colors hover:text-ember"
            :class="link.featured ? 'text-ember' : 'text-ash'"
          >
            {{ link.shortLabel }}
            <span class="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ember transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </nav>
  </section>
</template>
