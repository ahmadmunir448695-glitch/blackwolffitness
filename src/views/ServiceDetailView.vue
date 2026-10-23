<script setup>
import { computed, markRaw, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { programPage } from '@/seo/pages.js'
import { applyPageMeta } from '@/seo/usePageMeta.js'
import ServiceHero from '@/components/programs/ServiceHero.vue'
import ServiceCta from '@/components/programs/ServiceCta.vue'
import RelatedPrograms from '@/components/programs/RelatedPrograms.vue'
import AsyncState from '@/components/ui/AsyncState.vue'
import NotFoundView from './NotFoundView.vue'

import SectionIntro from '@/components/programs/sections/SectionIntro.vue'
import SectionFocus from '@/components/programs/sections/SectionFocus.vue'
import SectionLevels from '@/components/programs/sections/SectionLevels.vue'
import SectionSession from '@/components/programs/sections/SectionSession.vue'
import SectionBelts from '@/components/programs/sections/SectionBelts.vue'
import SectionCombos from '@/components/programs/sections/SectionCombos.vue'
import SectionRanges from '@/components/programs/sections/SectionRanges.vue'
import SectionFeature from '@/components/programs/sections/SectionFeature.vue'
import SectionGoalSteps from '@/components/programs/sections/SectionGoalSteps.vue'
import SectionSampleWeek from '@/components/programs/sections/SectionSampleWeek.vue'
import SectionSkillLadder from '@/components/programs/sections/SectionSkillLadder.vue'
import SectionAgeGroups from '@/components/programs/sections/SectionAgeGroups.vue'
import SectionSupport from '@/components/programs/sections/SectionSupport.vue'
import SectionSafety from '@/components/programs/sections/SectionSafety.vue'
import SectionParentSteps from '@/components/programs/sections/SectionParentSteps.vue'
import SectionBenefits from '@/components/programs/sections/SectionBenefits.vue'
import SectionCoaches from '@/components/programs/sections/SectionCoaches.vue'
import SectionSchedule from '@/components/programs/sections/SectionSchedule.vue'
import SectionFaq from '@/components/programs/sections/SectionFaq.vue'

/** Section type → [component, surface it sits on, needs the program prop]. */
const registry = {
  intro: [SectionIntro, ''],
  focus: [SectionFocus, ''],
  levels: [SectionLevels, 'bg-ink'],
  session: [SectionSession, ''],
  belts: [SectionBelts, 'bg-ink'],
  combos: [SectionCombos, 'bg-ink'],
  ranges: [SectionRanges, 'bg-ink'],
  feature: [SectionFeature, ''],
  goalSteps: [SectionGoalSteps, 'bg-ink'],
  sampleWeek: [SectionSampleWeek, 'bg-ink'],
  skillLadder: [SectionSkillLadder, 'bg-ink'],
  ageGroups: [SectionAgeGroups, ''],
  support: [SectionSupport, ''],
  safety: [SectionSafety, 'bg-ink'],
  parentSteps: [SectionParentSteps, ''],
  benefits: [SectionBenefits, ''],
  coaches: [SectionCoaches, 'bg-ink', true],
  schedule: [SectionSchedule, '', true],
  faq: [SectionFaq, ''],
}

const route = useRoute()
const slug = computed(() => route.params.slug)

const { data: program, loading, error, reload } = useAsync(
  ({ signal }) => api.programs.get(slug.value, { signal }),
  { watch: slug },
)

const isNotFound = computed(() => error.value?.code === 'not_found')
const sections = computed(() =>
  (program.value?.sections ?? [])
    .filter((s) => registry[s.type])
    .map((s, i) => ({ data: s, key: `${s.type}-${i}`, component: markRaw(registry[s.type][0]), surface: registry[s.type][1], needsProgram: Boolean(registry[s.type][2]) })),
)

watch(program, (value) => {
  if (value) applyPageMeta(programPage(value))
})
watch(isNotFound, (value) => {
  if (value) applyPageMeta({ title: 'Program not found', description: 'This program could not be found.', noindex: true })
})
</script>

<template>
  <NotFoundView v-if="isNotFound" />

  <div v-else-if="error" class="site-container pb-20 pt-[calc(var(--header-h)+5rem)] lg:pb-28 lg:pt-[calc(var(--header-h)+7rem)]">
    <AsyncState :error="error" error-title="This program could not load" @retry="reload" />
  </div>

  <div v-else>
    <div v-if="loading" class="site-container pb-16 pt-[calc(var(--header-h)+4rem)]" aria-busy="true">
      <span class="sr-only">Loading program…</span>
      <div class="skeleton h-6 w-40" aria-hidden="true" />
      <div class="skeleton mt-6 h-24 w-3/4 max-w-2xl" aria-hidden="true" />
      <div class="skeleton mt-6 h-5 w-2/3 max-w-xl" aria-hidden="true" />
      <div class="skeleton mt-12 h-[40vh] w-full" aria-hidden="true" />
    </div>

    <template v-else-if="program">
      <ServiceHero :program="program" />
      <section
v-for="section in sections"
        :key="section.key"
        v-reveal-auto
        :aria-labelledby="`${program.slug}-${section.key}`"
        class="py-16 lg:py-24"
        :class="section.surface"
      >
        <component
          :is="section.component"
          :section="section.data"
          v-bind="section.needsProgram ? { program } : {}"
          :heading-id="`${program.slug}-${section.key}`"
        />
      </section>
      <ServiceCta :program="program" />
      <RelatedPrograms :current="program.slug" />
    </template>
  </div>
</template>
