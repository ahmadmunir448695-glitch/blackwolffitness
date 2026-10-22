<script setup>
import { RouterLink } from 'vue-router'
import SmartImage from '../ui/SmartImage.vue'
import AppIcon from '../ui/AppIcon.vue'

/**
 * Program card: photo, name, short description and an "Explore program"
 * link that covers the whole tile. `tone="light"` is the Special Kids style.
 */
defineProps({
  program: { type: Object, required: true },
  tone: { type: String, default: 'dark' },
  index: { type: Number, default: 0 },
  sizes: { type: String, default: '(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw' },
  headingLevel: { type: String, default: 'h3' },
})
const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <article
    v-if="tone === 'light'"
    class="zoom-hover group relative grid h-full overflow-hidden bg-chalk text-graphite transition-shadow duration-500 hover:shadow-[0_30px_80px_-30px_rgb(247_134_15/0.55)] sm:grid-cols-[1.1fr_1fr]"
  >
    <SmartImage :image="program.image" :sizes="sizes" class="aspect-[4/3] sm:aspect-auto sm:h-full" />
    <div class="flex flex-col justify-between gap-6 p-6 sm:p-8">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full bg-ember/20 px-3 py-1 text-sm font-semibold text-rust">
          <span class="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" /> For children and their parents
        </p>
        <component :is="headingLevel" class="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] lg:text-5xl">
          {{ program.name }}
        </component>
        <p class="mt-3 leading-relaxed text-slate">{{ program.tagline }}</p>
      </div>
      <RouterLink
        :to="`/services/${program.slug}`"
        class="inline-flex items-center gap-3 font-semibold text-rust after:absolute after:inset-0 after:content-['']"
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-rust text-chalk transition-transform duration-300 group-hover:translate-x-1">
          <AppIcon name="arrowRight" class="h-4 w-4" />
        </span>
        Explore Program<span class="sr-only">: {{ program.name }}</span>
      </RouterLink>
    </div>
  </article>

  <article v-else class="zoom-hover group relative isolate flex h-full min-h-[20rem] flex-col justify-between overflow-hidden bg-coal">
    <SmartImage
      :image="program.image"
      :sizes="sizes"
      class="absolute inset-0 -z-20 h-full w-full"
      img-class="saturate-[0.85] group-hover:saturate-100"
    />
    <div class="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/10 transition-opacity duration-500 group-hover:opacity-90" aria-hidden="true" />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-tr from-ember/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      aria-hidden="true"
    />

    <div class="flex items-start justify-between p-6 sm:p-7">
      <span v-if="index" class="font-display text-xl font-bold tracking-wider text-bone/70" aria-hidden="true">{{ pad(index) }}</span>
      <span
        class="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-bone/30 bg-ink/30 text-bone backdrop-blur transition-all duration-300 group-hover:-rotate-45 group-hover:border-ember group-hover:bg-ember group-hover:text-ink"
        aria-hidden="true"
      >
        <AppIcon name="arrowRight" class="h-4 w-4" />
      </span>
    </div>

    <div class="p-6 sm:p-7">
      <component :is="headingLevel" class="font-display text-4xl font-extrabold uppercase leading-[0.95] text-bone transition-transform duration-500 group-hover:-translate-y-1 lg:text-5xl">
        {{ program.shortName ?? program.name }}
      </component>
      <p class="mt-2 max-w-md text-[0.95rem] leading-snug text-ash">{{ program.tagline }}</p>
      <RouterLink
        :to="`/services/${program.slug}`"
        class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ember after:absolute after:inset-0 after:content-[''] group-hover:text-ember-hi"
      >
        Explore Program<span class="sr-only">: {{ program.name }}</span>
        <AppIcon name="arrowRight" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </RouterLink>
      <span class="mt-5 block h-[2px] w-full origin-left scale-x-0 bg-ember transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
    </div>
  </article>
</template>
