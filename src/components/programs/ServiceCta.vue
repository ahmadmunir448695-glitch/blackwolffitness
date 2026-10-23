<script setup>
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import WhatsAppLink from '../layout/WhatsAppLink.vue'
import WolfMark from '../brand/WolfMark.vue'

/** Closing enrolment CTA for a service page (parents variant for kids). */
const props = defineProps({
  program: { type: Object, required: true },
})

const cta = computed(() => props.program.cta ?? {})
const forParents = computed(() => cta.value.audience === 'parents')
const link = computed(() => ({
  path: '/contact',
  query: { program: props.program.slug, topic: forParents.value ? 'parent' : 'trial' },
}))
const message = computed(() =>
  forParents.value
    ? 'Hi Black Wolf Fitness Club, I am a parent and would like to book a consultation for Special Kids Training.'
    : `Hi Black Wolf Fitness Club, I would like to book a trial session for ${props.program.name}.`,
)
</script>

<template>
  <section class="py-16 lg:py-24" aria-labelledby="service-cta-title">
    <div class="site-container">
      <div class="soft-round relative isolate overflow-hidden rounded-3xl border border-ember/40 bg-coal p-8 sm:p-12 lg:p-16">
        <div class="glow-ember pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 opacity-70" aria-hidden="true" />
        <WolfMark class="absolute -bottom-16 -right-10 -z-10 h-72 text-bone/[0.04] lg:h-96" />
        <p v-if="forParents" class="eyebrow">For parents and guardians</p>
        <h2 id="service-cta-title" class="max-w-3xl font-display text-display font-black uppercase" :class="forParents ? 'mt-2' : ''">
          {{ cta.heading }}
        </h2>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-ash">{{ cta.text }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <BaseButton :to="link" size="lg" icon-right="arrowRight">{{ cta.primaryLabel ?? 'Get in touch' }}</BaseButton>
          <WhatsAppLink :message="message" />
        </div>
      </div>
    </div>
  </section>
</template>
