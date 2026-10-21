<script setup>
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '../../ui/AsyncState.vue'
import AppIcon from '../../ui/AppIcon.vue'
import ScheduleTable from '../../shared/ScheduleTable.vue'
import WhatsAppLink from '../../layout/WhatsAppLink.vue'

const props = defineProps({
  section: { type: Object, required: true },
  program: { type: Object, required: true },
  headingId: { type: String, required: true },
})

const { data, loading, error, reload } = useAsync(
  ({ signal }) => api.schedule.list({ program: props.program.slug }, { signal }),
  { initial: [] },
)
</script>

<template>
  <div class="site-container">
    <h2 :id="headingId" class="font-display text-heading font-black uppercase">{{ section.heading }}</h2>
    <AsyncState class="mt-6" :loading="loading" :error="error" :empty="!data?.length" error-title="Class times could not load" @retry="reload">
      <template #loading><div class="skeleton h-32" aria-hidden="true" /></template>
      <template #empty>
        <div class="soft-round flex flex-col gap-5 border border-dashed border-line p-6 sm:flex-row sm:items-center sm:justify-between">
          <p class="flex items-start gap-3 text-ash">
            <AppIcon name="clock" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
            Class times are being finalised. Message the club for current {{ program.shortName ?? program.name }} timings.
          </p>
          <WhatsAppLink :message="`Hi Black Wolf Fitness Club, what are the current ${program.name} class times?`" label="Ask for timings" />
        </div>
      </template>
      <ScheduleTable :classes="data" />
    </AsyncState>
  </div>
</template>
