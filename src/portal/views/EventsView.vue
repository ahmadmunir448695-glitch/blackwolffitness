<script setup>
import { computed, ref } from 'vue'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import EventCard from '../components/EventCard.vue'
import EmptyState from '../components/EmptyState.vue'
import SearchBox from '../components/SearchBox.vue'
import { http } from '../lib/api.js'
import { EVENT_STATUS } from '../lib/format.js'
import { isClubUser } from '../lib/session.js'

const q = ref('')
const status = ref('')
const discipline = ref('')

const { data, loading, error, reload } = useAsync(
  ({ signal }) => http.get('/events', { q: q.value, status: status.value, discipline: discipline.value }, { signal }).then((d) => d.items),
  { watch: () => [q.value, status.value, discipline.value], initial: [] },
)

const statusTabs = [{ value: '', label: 'All' }, ...Object.entries(EVENT_STATUS).map(([value, s]) => ({ value, label: s.label }))]
const disciplines = [
  { value: '', label: 'All disciplines' },
  { value: 'kyorugi', label: 'Kyorugi' },
  { value: 'poomsae', label: 'Poomsae' },
  { value: 'breaking', label: 'Breaking' },
  { value: 'demonstration', label: 'Team Demonstration' },
]
const filtered = computed(() => Boolean(q.value || status.value || discipline.value))
</script>

<template>
  <div>
    <PageHeader eyebrow="Events" title="Championships" subtitle="Open, upcoming and past championships. Open an event for its rules, categories, fees and schedule." />

    <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="p-tabs border-b-0" role="tablist" aria-label="Filter by status">
        <button v-for="t in statusTabs" :key="t.value" type="button" role="tab" class="p-tab" :aria-selected="status === t.value ? 'true' : 'false'" @click="status = t.value">{{ t.label }}</button>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <SearchBox v-model="q" placeholder="Search name or city" label="Search championships" />
        <label class="sm:w-52">
          <span class="sr-only">Discipline</span>
          <select v-model="discipline" class="p-select">
            <option v-for="d in disciplines" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </label>
      </div>
    </div>

    <AsyncState :loading="loading && !data.length" :error="error" :empty="!data.length" error-title="Championships could not load" @retry="reload">
      <template #loading>
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="n in 3" :key="n" class="skeleton h-[26rem]" />
        </div>
      </template>
      <template #empty>
        <EmptyState
          icon="trophy"
          :title="filtered ? 'No matching championships' : 'No championships yet'"
          :message="filtered ? 'Try another status, discipline or search.' : 'Published championships will appear here as soon as organizers open them.'"
        />
      </template>
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <EventCard v-for="e in data" :key="e.id" :event="e" :can-register="isClubUser" />
      </div>
    </AsyncState>
  </div>
</template>
