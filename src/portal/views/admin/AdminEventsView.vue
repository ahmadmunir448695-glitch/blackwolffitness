<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import SearchBox from '../../components/SearchBox.vue'
import { fileUrl, http } from '../../lib/api.js'
import { fmtDate, fmtRange } from '../../lib/format.js'
import { toast } from '../../lib/ui.js'

const events = ref([])
const loading = ref(true)
const error = ref('')
const q = ref('')
const busy = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    events.value = (await http.get('/admin/events')).items || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const term = q.value.toLowerCase()
  if (!term) return events.value
  return events.value.filter((e) => [e.name, e.city, e.organizer, e.venue_name].some((v) => String(v || '').toLowerCase().includes(term)))
})

async function togglePublish(ev, e) {
  busy.value = ev.id
  try {
    const res = await http.post(`/admin/events/${ev.id}/publish`, { published: !ev.published })
    Object.assign(ev, res.event)
    toast.success(res.event.published ? `${ev.name} is now published.` : `${ev.name} is hidden from clubs.`)
  } catch (err) {
    if (e?.target) e.target.checked = ev.published
    toast.error(err)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Championships" subtitle="Create championships, set up categories and control what clubs can see.">
      <template #actions>
        <BaseButton size="sm" icon="plus" to="/portal/admin/events/new">New championship</BaseButton>
      </template>
    </PageHeader>

    <div v-if="events.length" class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchBox v-model="q" label="Search championships" placeholder="Search name, city, organizer" />
      <p class="text-sm text-smoke">{{ filtered.length }} of {{ events.length }} championships</p>
    </div>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-busy="true">
      <div v-for="n in 4" :key="n" class="skeleton h-56" />
    </div>

    <EmptyState v-else-if="error" icon="alert" title="Could not load championships" :message="error">
      <BaseButton size="sm" variant="outline" icon="refresh" @click="load">Try again</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="!events.length" icon="trophy" title="No championships yet" message="Create your first championship, then add age groups, weight classes and categories before publishing it.">
      <BaseButton size="sm" icon="plus" to="/portal/admin/events/new">New championship</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="!filtered.length" icon="info" title="No matches" message="No championship matches your search." />

    <ul v-else class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <li v-for="ev in filtered" :key="ev.id" class="p-card p-card-hover group flex flex-col">
        <RouterLink :to="`/portal/admin/events/${ev.id}`" class="flex flex-1 gap-4 p-4 sm:p-5">
          <span class="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden border border-line bg-iron sm:h-28 sm:w-24">
            <img v-if="ev.poster_url" :src="fileUrl(ev.poster_url)" alt="" class="h-full w-full object-cover" loading="lazy" />
            <AppIcon v-else name="trophy" class="h-7 w-7 text-smoke" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2">
              <StatusBadge :value="ev.status" kind="event" />
              <span class="p-badge" :class="ev.published ? 'tone-success' : 'tone-muted'">{{ ev.published ? 'Published' : 'Draft' }}</span>
            </span>
            <span class="mt-2 block font-display text-xl uppercase leading-tight tracking-wide text-bone group-hover:text-ember">{{ ev.name }}</span>
            <span class="mt-1 block text-sm text-ash">{{ fmtRange(ev.start_date, ev.end_date) }}<template v-if="ev.city"> · {{ ev.city }}</template></span>
            <span class="mt-1 block text-xs text-smoke">Registration closes {{ fmtDate(ev.registration_deadline) }}</span>
          </span>
        </RouterLink>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          <p class="text-sm text-smoke">
            <RouterLink :to="{ path: '/portal/admin/registrations', query: { eventId: ev.id } }" class="font-semibold text-bone hover:text-ember">{{ ev.entry_count }} entries</RouterLink>
            · {{ ev.team_count }} teams · {{ ev.category_count }} categories
          </p>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-ash">
            <input type="checkbox" class="p-check" :checked="ev.published" :disabled="busy === ev.id" @change="togglePublish(ev, $event)" />
            Published
          </label>
        </div>
      </li>
    </ul>
  </div>
</template>
