<script setup>
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { media } from '@/data/media.js'
import PageIntro from '@/components/shared/PageIntro.vue'
import ProgramGrid from '@/components/programs/ProgramGrid.vue'
import TrialBand from '@/components/shared/TrialBand.vue'
import AsyncState from '@/components/ui/AsyncState.vue'

const { data: programs, loading, error, reload } = useAsync(({ signal }) => api.programs.list({ signal }), { initial: [] })

const guide = [
  { goal: 'Kicks, flexibility and a belt system', program: 'Taekwondo', to: '/services/taekwondo' },
  { goal: 'Punching technique and conditioning', program: 'Boxing', to: '/services/boxing' },
  { goal: 'Punches and kicks together', program: 'Kickboxing', to: '/services/kickboxing' },
  { goal: 'Striking, clinch and ground skills', program: 'MMA', to: '/services/mma' },
  { goal: 'Strength, stamina and mobility', program: 'General Fitness', to: '/services/general-fitness' },
  { goal: 'Body control, balance and flexibility', program: 'Gymnastics', to: '/services/gymnastics' },
  { goal: 'Individualized support for a child', program: 'Special Kids Training', to: '/services/special-kids-training' },
]
</script>

<template>
  <div>
    <PageIntro
      title="Training programs"
      eyebrow="What we teach"
      lead="Martial arts, combat sports, fitness and gymnastics, each coached with a clear progression from your first session. Not sure where to start? Use the guide below."
      :image="media.ringTraining"
    />

    <section v-reveal-auto class="py-16 lg:py-24" aria-label="All programs">
      <div class="site-container">
        <AsyncState :loading="loading" :error="error" :empty="!programs?.length" error-title="Programs could not load" @retry="reload">
          <template #loading>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              <div v-for="n in 6" :key="n" class="skeleton h-80" />
            </div>
          </template>
          <template #empty>
            <p class="border border-dashed border-line p-8 text-ash">Programs will be listed here soon.</p>
          </template>
          <ProgramGrid :programs="programs" heading-level="h2" />
        </AsyncState>
      </div>
    </section>

    <section v-reveal-auto class="border-t border-line bg-ink py-16 lg:py-24" aria-labelledby="guide-title">
      <div class="site-container grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <h2 id="guide-title" class="font-display text-title font-black uppercase">Which program is for me?</h2>
          <p class="mt-4 max-w-md text-lg text-ash">Start from what you want to get out of training. You can always add a second program later.</p>
        </div>
        <dl class="divide-y divide-line border-y border-line">
          <div v-for="row in guide" :key="row.to" class="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
            <dt class="text-ash">{{ row.goal }}</dt>
            <dd>
              <RouterLink :to="row.to" class="font-display text-2xl font-bold uppercase text-bone hover:text-ember">{{ row.program }}</RouterLink>
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <TrialBand />
  </div>
</template>
