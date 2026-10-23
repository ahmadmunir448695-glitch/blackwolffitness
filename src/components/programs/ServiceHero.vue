<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SmartImage from '../ui/SmartImage.vue'
import BaseButton from '../ui/BaseButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import WhatsAppLink from '../layout/WhatsAppLink.vue'

/**
 * Service page hero. Layout comes from program.hero.variant:
 *   full          full-bleed photo (Boxing, MMA)
 *   split         text left, tall photo right (Taekwondo, Fitness, Gymnastics)
 *   split-reverse angled photo left, text right (Kickboxing)
 *   light         calm parent-facing layout (Special Kids Training)
 * program.hero.mark adds a discipline detail: 'belts' or 'numbers'.
 */
const props = defineProps({
  program: { type: Object, required: true },
})

const hero = computed(() => props.program.hero ?? {})
const variant = computed(() => hero.value.variant ?? 'split')
const forParents = computed(() => props.program.cta?.audience === 'parents')

const contactLink = computed(() => ({
  path: '/contact',
  query: { program: props.program.slug, topic: forParents.value ? 'parent' : 'trial' },
}))

const whatsappMessage = computed(() =>
  forParents.value
    ? `Hi Black Wolf Fitness Club, I am a parent and would like to know more about Special Kids Training for my child.`
    : `Hi Black Wolf Fitness Club, I am interested in ${props.program.name}. Could you share class details and a trial session?`,
)

const beltColours = computed(() => {
  const belts = props.program.sections?.find((s) => s.type === 'belts')?.belts ?? []
  return belts.map((b) => b.hex)
})

const punchLegend = computed(() => props.program.sections?.find((s) => s.type === 'combos')?.legend ?? [])
const reassurance = ['Parent consultation first', 'Individualized Support', 'Supervised sessions']
</script>

<template>
  <!-- FULL ---------------------------------------------------------------->
  <section v-if="variant === 'full'" class="relative isolate overflow-hidden pt-[var(--header-h)]" aria-labelledby="service-title">
    <SmartImage :image="hero.image" priority img-class="anim-kenburns" sizes="100vw" :widths="[640, 960, 1280, 1600, 2200]" class="absolute inset-0 -z-20 h-full w-full" />
    <div class="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/30" aria-hidden="true" />
    <div class="glow-ember anim-glow pointer-events-none absolute -bottom-48 -left-40 -z-10 h-[34rem] w-[34rem]" aria-hidden="true" />
    <div class="site-container flex min-h-[78svh] flex-col justify-end pb-12 pt-28 lg:pb-16">
      <nav aria-label="Breadcrumb" class="mb-6 text-sm text-ash">
        <RouterLink to="/services" class="hover:text-ember">Services</RouterLink>
        <span aria-hidden="true" class="mx-2 text-smoke">/</span>
        <span aria-current="page" class="text-bone">{{ program.shortName ?? program.name }}</span>
      </nav>
      <h1 id="service-title" style="animation-delay: 0.08s" class="anim-fade-up font-display text-mega font-black uppercase text-shadow-hero">{{ hero.title }}</h1>
      <div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,40rem)_1fr] lg:items-end">
        <p class="anim-fade-up text-lg leading-relaxed text-ash sm:text-xl" style="animation-delay: 0.25s">{{ hero.lead }}</p>
        <div class="flex flex-wrap gap-3 lg:justify-end">
          <BaseButton :to="contactLink" size="lg" icon-right="arrowRight">{{ program.cta?.primaryLabel ?? 'Book a trial' }}</BaseButton>
          <WhatsAppLink :message="whatsappMessage" />
        </div>
      </div>
      <ul v-if="hero.mark === 'numbers' && punchLegend.length" class="mt-10 flex flex-wrap gap-2" aria-label="Punch numbers">
        <li v-for="p in punchLegend" :key="p.key" class="flex items-center gap-2 border border-bone/20 bg-ink/60 py-1.5 pl-1.5 pr-3 text-sm backdrop-blur">
          <span class="flex h-7 w-7 items-center justify-center bg-ember font-display text-lg font-black text-ink">{{ p.key }}</span>
          <span class="text-ash">{{ p.name }}</span>
        </li>
      </ul>
    </div>
  </section>

  <!-- LIGHT (Special Kids) ------------------------------------------------>
  <section v-else-if="variant === 'light'" class="overflow-hidden pt-[var(--header-h)]" aria-labelledby="service-title">
    <div class="site-container grid gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-20">
      <div>
        <nav aria-label="Breadcrumb" class="mb-6 text-sm text-ash">
          <RouterLink to="/services" class="hover:text-ember">Services</RouterLink>
          <span aria-hidden="true" class="mx-2 text-smoke">/</span>
          <span aria-current="page" class="text-bone">{{ program.name }}</span>
        </nav>
        <h1 id="service-title" style="animation-delay: 0.08s" class="anim-fade-up font-display text-display font-black uppercase">{{ hero.title }}</h1>
        <p class="anim-fade-up mt-6 max-w-xl text-lg leading-relaxed text-ash sm:text-xl" style="animation-delay: 0.25s">{{ hero.lead }}</p>
        <ul class="mt-6 flex flex-wrap gap-2">
          <li v-for="item in reassurance" :key="item" class="inline-flex items-center gap-1.5 rounded-full bg-coal px-3.5 py-1.5 text-sm font-medium">
            <AppIcon name="check" class="h-4 w-4 text-ember" /> {{ item }}
          </li>
        </ul>
        <div class="mt-8 flex flex-wrap gap-3">
          <BaseButton :to="contactLink" size="lg">{{ program.cta?.primaryLabel ?? 'Talk to us' }}</BaseButton>
          <WhatsAppLink :message="whatsappMessage" label="WhatsApp a coach" />
        </div>
      </div>
      <div class="relative">
        <div class="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-ember/35" aria-hidden="true" />
        <SmartImage :image="hero.image" priority sizes="(min-width: 1024px) 45vw, 100vw" class="soft-round relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]" />
      </div>
    </div>
  </section>

  <!-- SPLIT / SPLIT-REVERSE ---------------------------------------------->
  <section v-else class="relative overflow-hidden border-b border-line pt-[var(--header-h)]" aria-labelledby="service-title">
    <div class="grid lg:min-h-[78svh] lg:grid-cols-2">
      <div
        class="relative h-[52svh] lg:h-auto"
        :class="variant === 'split-reverse' ? 'lg:order-1' : 'lg:order-2'"
      >
        <SmartImage
          :image="hero.image"
          priority
          img-class="anim-settle"
          sizes="(min-width: 1024px) 50vw, 100vw"
          class="absolute inset-0 h-full w-full"
          :class="variant === 'split-reverse' ? 'lg:[clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]' : 'lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]'"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-ink to-transparent lg:hidden" aria-hidden="true" />
      </div>

      <div
        class="site-container relative -mt-24 flex flex-col justify-center pb-14 lg:mt-0 lg:max-w-none lg:py-20"
        :class="variant === 'split-reverse' ? 'lg:order-2 lg:pl-6 lg:pr-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))]' : 'lg:order-1 lg:pl-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] lg:pr-6'"
      >
        <nav aria-label="Breadcrumb" class="mb-6 text-sm text-ash">
          <RouterLink to="/services" class="hover:text-ember">Services</RouterLink>
          <span aria-hidden="true" class="mx-2 text-smoke">/</span>
          <span aria-current="page" class="text-bone">{{ program.shortName ?? program.name }}</span>
        </nav>
        <h1 id="service-title" style="animation-delay: 0.08s" class="anim-fade-up font-display text-display font-black uppercase xl:text-[6.5rem]">{{ hero.title }}</h1>

        <div v-if="hero.mark === 'belts' && beltColours.length" class="mt-6 flex h-3 max-w-sm" aria-hidden="true">
          <span v-for="hex in beltColours" :key="hex" class="flex-1 first:border-l border-y border-r border-bone/15" :style="{ backgroundColor: hex }" />
        </div>

        <p class="anim-fade-up mt-6 max-w-xl text-lg leading-relaxed text-ash sm:text-xl" style="animation-delay: 0.25s">{{ hero.lead }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <BaseButton :to="contactLink" size="lg" icon-right="arrowRight">{{ program.cta?.primaryLabel ?? 'Book a trial' }}</BaseButton>
          <WhatsAppLink :message="whatsappMessage" />
        </div>
      </div>
    </div>
  </section>
</template>
