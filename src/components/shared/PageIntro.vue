<script setup>
import SmartImage from '../ui/SmartImage.vue'
import ClawMarks from '../brand/ClawMarks.vue'

/** Opening block for interior pages (About, Services, Coaches, Membership, Contact). */
defineProps({
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  image: { type: Object, default: null },
  eyebrow: { type: String, default: 'Black Wolf Fitness Club' },
})
</script>

<template>
  <section class="relative isolate overflow-hidden border-b border-line" aria-labelledby="page-title">
    <!-- Atmosphere: the same photo, blurred and dimmed, fills the whole band -->
    <div v-if="image" class="absolute inset-0 -z-20" aria-hidden="true">
      <SmartImage :image="image" alt="" sizes="60vw" :widths="[480, 768]" class="h-full w-full" img-class="scale-110 blur-2xl" />
    </div>
    <div class="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/95 to-ink/80" aria-hidden="true" />
    <div class="glow-ember anim-glow pointer-events-none absolute -left-40 -top-40 -z-10 h-[30rem] w-[30rem] opacity-70" aria-hidden="true" />

    <div class="site-container grid gap-10 py-16 lg:items-center lg:py-24" :class="image ? 'lg:grid-cols-[1.15fr_1fr]' : ''">
      <div>
        <p class="eyebrow anim-fade">{{ eyebrow }}</p>
        <h1 id="page-title" class="mt-6 font-display text-display font-black uppercase xl:text-[6.25rem]">
          <span class="block overflow-hidden pb-[0.04em]"><span class="anim-rise block" style="animation-delay: 0.08s">{{ title }}</span></span>
        </h1>
        <p v-if="lead" class="anim-fade-up mt-6 max-w-2xl text-lg leading-relaxed text-ash sm:text-xl" style="animation-delay: 0.3s">{{ lead }}</p>
        <div v-if="$slots.default" class="anim-fade-up mt-8 flex flex-wrap gap-3" style="animation-delay: 0.42s"><slot /></div>
      </div>

      <div v-if="image" class="relative">
        <ClawMarks
          animate
          :delay="0.6"
          class="pointer-events-none absolute -right-6 -top-10 z-10 hidden h-40 text-ember drop-shadow-[0_0_20px_rgb(247_134_15/0.5)] lg:block"
        />
        <div class="anim-fade-up" style="animation-delay: 0.2s">
          <SmartImage
            :image="image"
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            class="cut-corner-lg aspect-[16/11]"
            img-class="anim-settle"
          />
        </div>
        <div class="absolute -bottom-3 -left-3 -z-10 h-full w-full border border-ember/40" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>
