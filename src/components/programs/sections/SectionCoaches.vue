<script setup>
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '../../ui/AsyncState.vue'
import BaseButton from '../../ui/BaseButton.vue'
import CoachCard from '../../coaches/CoachCard.vue'
import CoachSkeleton from '../../coaches/CoachSkeleton.vue'

/** Coaches who teach this program, loaded through the API layer. */
const props = defineProps({
  section: { type: Object, required: true },
  program: { type: Object, required: true },
  headingId: { type: String, required: true },
})

const { data, loading, error, reload } = useAsync(
  ({ signal }) => api.coaches.list({ program: props.program.slug }, { signal }),
  { initial: [] },
)
</script>

<template>
  <div class="site-container">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <BaseButton to="/coaches" variant="ghost" icon-right="arrowRight">All coaches</BaseButton>
    </div>
    <AsyncState class="mt-10" :loading="loading" :error="error" :empty="!data?.length" error-title="Coach profiles could not load" @retry="reload">
      <template #loading><CoachSkeleton :count="3" /></template>
      <template #empty>
        <p class="soft-round border border-dashed border-line p-8 text-ash">
          Coach profiles for {{ program.shortName ?? program.name }} will be added soon. Contact the club to meet the team.
        </p>
      </template>
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="coach in data" :key="coach.slug"><CoachCard :coach="coach" class="soft-round overflow-hidden" /></li>
      </ul>
    </AsyncState>
  </div>
</template>
