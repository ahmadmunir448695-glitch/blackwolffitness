<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { clubMoments } from '@/data/content.js'
import { applyJsonLd, siteUrl } from '@/seo/usePageMeta.js'
import { organizationJsonLd } from '@/seo/structuredData.js'
import HomeHero from '@/components/home/HomeHero.vue'
import WhySection from '@/components/home/WhySection.vue'
import CoachesPreview from '@/components/home/CoachesPreview.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import StatsBand from '@/components/home/StatsBand.vue'
import QuoteBand from '@/components/home/QuoteBand.vue'
import DisciplineMarquee from '@/components/shared/DisciplineMarquee.vue'
import ProgramGrid from '@/components/programs/ProgramGrid.vue'
import ClubMoments from '@/components/home/ClubMoments.vue'
import TrialBand from '@/components/shared/TrialBand.vue'
import AsyncState from '@/components/ui/AsyncState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { data: programs, loading, error, reload } = useAsync(({ signal }) => api.programs.list({ signal }), { initial: [] })

onMounted(() => applyJsonLd('ld-organization', organizationJsonLd(siteUrl)))
onBeforeUnmount(() => applyJsonLd('ld-organization', null))
</script>

<template>
  <div>
    <HomeHero />
    <DisciplineMarquee />

    <section class="pb-20 pt-10 lg:pb-28 lg:pt-14" aria-labelledby="programs-title">
      <div class="site-container">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div v-reveal class="max-w-2xl">
            <p class="eyebrow">Seven ways to train</p>
            <h2 id="programs-title" class="mt-5 font-display text-display font-black uppercase">Training <span class="text-ember">programs</span></h2>
            <p class="mt-4 text-lg text-ash">
              Seven programs, one standard of coaching. Pick the one that fits your goals, or combine them.
            </p>
          </div>
          <BaseButton to="/services" variant="outline" icon-right="arrowRight">All programs</BaseButton>
        </div>

        <AsyncState class="mt-10" :loading="loading" :error="error" :empty="!programs?.length" error-title="Programs could not load" @retry="reload">
          <template #loading>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              <div v-for="n in 6" :key="n" class="skeleton h-80" />
            </div>
          </template>
          <template #empty>
            <p class="border border-dashed border-line p-8 text-ash">Programs will be listed here soon.</p>
          </template>
          <ProgramGrid :programs="programs" />
        </AsyncState>
      </div>
    </section>

    <StatsBand />
    <WhySection />
    <QuoteBand />
    <CoachesPreview />

    <section class="border-t border-line bg-ink py-20 lg:py-28" aria-labelledby="environment-title">
      <div class="site-container">
        <div v-reveal class="max-w-2xl">
          <p class="eyebrow">Inside the club</p>
          <h2 id="environment-title" class="mt-5 font-display text-display font-black uppercase">Wins &amp; <span class="text-outline-ember">moments</span></h2>
          <p class="mt-4 text-lg text-ash">Medals, trophies, international camps and our young champions: the people who make Black Wolf a club.</p>
        </div>
        <ClubMoments :items="clubMoments" class="mt-10" />
      </div>
    </section>

    <TrialBand />
    <TestimonialsSection />
  </div>
</template>
