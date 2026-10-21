<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { coachSpecializations } from '@/services/catalog.js'
import PageIntro from '@/components/shared/PageIntro.vue'
import { media } from '@/data/media.js'
import CoachCard from '@/components/coaches/CoachCard.vue'
import CoachSkeleton from '@/components/coaches/CoachSkeleton.vue'
import AsyncState from '@/components/ui/AsyncState.vue'
import TrialBand from '@/components/shared/TrialBand.vue'

const route = useRoute()
const router = useRouter()

const { data: coaches, loading, error, reload } = useAsync(({ signal }) => api.coaches.list({}, { signal }), { initial: [] })

const active = computed(() => {
  const value = String(route.query.specialization ?? '')
  return coachSpecializations.includes(value) ? value : ''
})

/** Only show filters that at least one coach matches. */
const filters = computed(() =>
  coachSpecializations.filter((tag) => (coaches.value ?? []).some((c) => c.specializations.includes(tag))),
)

const visible = computed(() =>
  (coaches.value ?? []).filter((c) => !active.value || c.specializations.includes(active.value)),
)

function setFilter(tag) {
  router.replace({ query: { ...route.query, specialization: tag || undefined } })
}
</script>

<template>
  <div>
    <PageIntro
      title="Our coaches"
      eyebrow="The team"
      :image="media.punchingBags"
      lead="Every program is led by coaches who teach technique properly and keep training safe. Filter by discipline, then open a profile to see experience, programs and how to train with them."
    />

    <section class="py-14 lg:py-20" aria-labelledby="directory-title">
      <div class="site-container">
        <h2 id="directory-title" class="sr-only">Coach directory</h2>

        <div v-if="filters.length > 1" class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter coaches by specialization">
          <button
            type="button"
            class="h-10 border px-4 text-sm font-semibold transition-colors"
            :class="!active ? 'border-ember bg-ember text-ink' : 'border-line text-ash hover:border-smoke hover:text-bone'"
            :aria-pressed="!active ? 'true' : 'false'"
            @click="setFilter('')"
          >
            All coaches
          </button>
          <button
            v-for="tag in filters"
            :key="tag"
            type="button"
            class="h-10 border px-4 text-sm font-semibold transition-colors"
            :class="active === tag ? 'border-ember bg-ember text-ink' : 'border-line text-ash hover:border-smoke hover:text-bone'"
            :aria-pressed="active === tag ? 'true' : 'false'"
            @click="setFilter(tag)"
          >
            {{ tag }}
          </button>
        </div>

        <p class="mt-6 text-sm text-smoke" aria-live="polite">
          <template v-if="!loading && !error">
            Showing {{ visible.length }} {{ visible.length === 1 ? 'coach' : 'coaches' }}{{ active ? ` for ${active}` : '' }}
          </template>
        </p>

        <AsyncState class="mt-4" :loading="loading" :error="error" :empty="!visible.length" error-title="Coach profiles could not load" @retry="reload">
          <template #loading><CoachSkeleton :count="8" /></template>
          <template #empty>
            <div class="border border-dashed border-line p-8">
              <p class="text-ash">
                {{ active ? `No ${active} coach profiles are listed yet.` : 'Coach profiles will be published soon.' }}
              </p>
              <button v-if="active" type="button" class="link-ember mt-3 text-sm font-semibold" @click="setFilter('')">Show all coaches</button>
            </div>
          </template>
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="coach in visible" :key="coach.slug"><CoachCard :coach="coach" /></li>
          </ul>
        </AsyncState>
      </div>
    </section>

    <TrialBand heading="Train with the team" text="Book a trial session and meet the coach who leads your program." />
  </div>
</template>
