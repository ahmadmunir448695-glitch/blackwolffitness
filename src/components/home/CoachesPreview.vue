<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '../ui/AsyncState.vue'
import BaseButton from '../ui/BaseButton.vue'
import SmartImage from '../ui/SmartImage.vue'
import AppIcon from '../ui/AppIcon.vue'
import ClawMarks from '../brand/ClawMarks.vue'
import CoachCard from '../coaches/CoachCard.vue'
import CoachSkeleton from '../coaches/CoachSkeleton.vue'
import WhatsAppLink from '../layout/WhatsAppLink.vue'

const { data, loading, error, reload } = useAsync(({ signal }) => api.coaches.list({}, { signal }), { initial: [] })

/** The first real coach with a photo is spotlighted; the rest show as cards. */
const featured = computed(() => (data.value ?? []).find((c) => !c.placeholder && c.photo?.src) ?? null)
const shown = computed(() => (data.value ?? []).filter((c) => c !== featured.value).slice(0, 4))
const medals = computed(() => (featured.value?.achievements ?? []).slice(0, 4))

function medalTone(text) {
  if (/gold/i.test(text)) return 'bg-[#e8b84a]'
  if (/silver/i.test(text)) return 'bg-[#c9ccd3]'
  if (/bronze/i.test(text)) return 'bg-[#c27a45]'
  return 'bg-ember'
}
</script>

<template>
  <section class="py-20 lg:py-28" aria-labelledby="coaches-title">
    <div class="site-container">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div v-reveal class="max-w-2xl">
          <p class="eyebrow">The team</p>
          <h2 id="coaches-title" class="mt-5 font-display text-display font-black uppercase">Meet our <span class="text-outline-ember">coaches</span></h2>
          <p class="mt-4 text-lg text-ash">The people who will teach, correct and push you. Full profiles are on the Coaches page.</p>
        </div>
        <BaseButton to="/coaches" variant="outline" icon-right="arrowRight">All coaches</BaseButton>
      </div>

      <AsyncState class="mt-10" :loading="loading" :error="error" :empty="!(data ?? []).length" error-title="Coach profiles could not load" @retry="reload">
        <template #loading><CoachSkeleton /></template>
        <template #empty>
          <p class="border border-dashed border-line p-8 text-ash">Coach profiles will be published soon.</p>
        </template>

        <!-- Spotlight -->
        <article
          v-if="featured"
          v-reveal
          class="group relative isolate mb-3 grid overflow-hidden border border-line bg-coal md:grid-cols-[0.85fr_1.15fr]"
          aria-labelledby="featured-coach"
        >
          <div class="zoom-hover relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[34rem]">
            <SmartImage :image="featured.photo" sizes="(min-width: 768px) 40vw, 100vw" position="50% 20%" class="absolute inset-0 h-full w-full" />
            <div class="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-coal" aria-hidden="true" />
          </div>
          <div class="relative flex flex-col justify-center p-6 sm:p-10">
            <ClawMarks class="pointer-events-none absolute -right-6 -top-6 -z-10 h-48 text-ember/10" />
            <p class="eyebrow">{{ featured.role }}</p>
            <h3 id="featured-coach" class="mt-4 font-display text-[clamp(2.75rem,6vw,5rem)] font-black uppercase leading-[0.9]">
              {{ featured.name }}
            </h3>
            <dl v-if="featured.facts.length" class="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
              <div v-for="fact in featured.facts.slice(0, 4)" :key="fact.label" class="bg-ink/70 p-3">
                <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-ash">{{ fact.label }}</dt>
                <dd class="mt-1 font-display text-lg font-bold uppercase leading-tight text-bone">{{ fact.value }}</dd>
              </div>
            </dl>
            <ul v-if="medals.length" class="mt-6 space-y-2.5" aria-label="Championships and medals">
              <li v-for="item in medals" :key="item" class="flex items-start gap-3 text-ash">
                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" :class="medalTone(item)" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
            <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <RouterLink
                :to="`/coaches/${featured.slug}`"
                class="inline-flex items-center gap-2 font-semibold text-ember after:absolute after:inset-0 after:content-[''] hover:text-ember-hi"
              >
                View full profile<span class="sr-only">: {{ featured.name }}</span>
                <AppIcon name="arrowRight" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </RouterLink>
              <WhatsAppLink
                v-if="featured.whatsapp"
                class="relative z-10"
                :number="featured.whatsapp"
                :label="`WhatsApp ${featured.name.split(' ')[0]}`"
                :message="`Hi ${featured.name.split(' ')[0]}, I found you on the Black Wolf Fitness Club website and would like to train with you.`"
              />
            </div>
          </div>
        </article>

        <ul
          v-if="shown.length"
          v-reveal-stagger
          class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          <li v-for="coach in shown" :key="coach.slug" class="w-[78%] shrink-0 snap-start sm:w-auto"><CoachCard :coach="coach" /></li>
        </ul>
      </AsyncState>
    </div>
  </section>
</template>
