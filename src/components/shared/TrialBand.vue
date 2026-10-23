<script setup>
import BaseButton from '../ui/BaseButton.vue'
import SmartImage from '../ui/SmartImage.vue'
import WhatsAppLink from '../layout/WhatsAppLink.vue'
import WolfMark from '../brand/WolfMark.vue'
import { media } from '@/data/media.js'

/** Full-width call to action for membership details and trial sessions. */
defineProps({
  heading: { type: String, default: 'Your first session starts with one message' },
  text: {
    type: String,
    default: 'Tell us which program you are interested in. We will share membership details and arrange a trial session at a time that suits you.',
  },
  primaryLabel: { type: String, default: 'See membership options' },
  primaryTo: { type: [String, Object], default: '/membership' },
  whatsappMessage: { type: String, default: undefined },
  image: { type: Object, default: () => media.kickboxingCoach },
})
</script>

<template>
  <section class="relative isolate overflow-hidden border-y border-line bg-ink">
    <!-- Photo on the right, cut on the claw angle -->
    <div class="absolute inset-y-0 right-0 -z-10 hidden w-[44%] lg:block [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true">
      <div v-parallax="0.08" class="absolute -inset-y-[12%] inset-x-0">
        <SmartImage :image="image" alt="" sizes="45vw" :widths="[640, 960, 1280]" class="h-full w-full" img-class="grayscale contrast-125" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-ink/10" />
    </div>
    <div class="glow-ember pointer-events-none absolute -left-40 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-y-1/2 opacity-50" aria-hidden="true" />
    <WolfMark class="absolute -left-24 -top-16 -z-10 h-[150%] text-bone/[0.02]" />

    <div class="site-container py-16 lg:py-24">
      <div class="max-w-2xl">
        <p v-reveal class="eyebrow">Book a trial session</p>
        <h2 v-reveal="{ delay: 80 }" class="mt-5 font-display text-display font-black uppercase">{{ heading }}</h2>
        <p v-reveal="{ delay: 160 }" class="mt-5 max-w-xl text-lg leading-relaxed text-ash">{{ text }}</p>
        <div v-reveal="{ delay: 240 }" class="mt-8 flex flex-wrap gap-3">
          <BaseButton :to="primaryTo" size="lg" icon-right="arrowRight">{{ primaryLabel }}</BaseButton>
          <WhatsAppLink :message="whatsappMessage" />
        </div>
      </div>
    </div>
  </section>
</template>
