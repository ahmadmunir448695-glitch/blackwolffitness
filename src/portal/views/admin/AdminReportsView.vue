<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import EmptyState from '../../components/EmptyState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { download, http } from '../../lib/api.js'
import { DISCIPLINE_LABELS } from '../../lib/format.js'
import { toast } from '../../lib/ui.js'
import { useAdminEvents } from './adminShared.js'

const { events, loading: eventsLoading } = useAdminEvents()
const eventId = ref('')
const approvedOnly = ref(false)
const report = ref(null)
const loading = ref(false)
const open = ref(new Set())

watch(events, (list) => {
  if (!eventId.value && list.length) eventId.value = String(list[0].id)
})

async function load() {
  if (!eventId.value) return
  loading.value = true
  try {
    report.value = await http.get('/admin/reports/categories', { eventId: eventId.value, approvedOnly: approvedOnly.value ? 1 : 0 })
    open.value = new Set(report.value.categories.filter((c) => c.entry_count).map((c) => c.id))
  } catch (err) {
    toast.error(err)
  } finally {
    loading.value = false
  }
}
watch([eventId, approvedOnly], load)

const exportsList = [
  { kind: 'entries', label: 'All entries', hint: 'Every registration with status, payment and category.' },
  { kind: 'athletes', label: 'Athlete list', hint: 'One row per athlete per entry, with ID, belt and weight.' },
  { kind: 'teams', label: 'Team list', hint: 'Participating teams with coaches, entry counts and fees.' },
  { kind: 'categories', label: 'Category summary', hint: 'Entries per category and weight class.' },
]
const csv = (kind) => download(`/admin/reports/${kind}.csv`, { eventId: eventId.value }, `${kind}.csv`).catch(toast.error)

const groups = computed(() => {
  const out = {}
  for (const c of report.value?.categories ?? []) (out[c.discipline] ||= []).push(c)
  return Object.entries(out)
})
function byWeight(entries) {
  const out = {}
  for (const e of entries) (out[e.weight_name || 'All'] ||= []).push(e)
  return Object.entries(out)
}
const printReport = () => window.print()
function toggle(id) {
  const s = new Set(open.value)
  s.has(id) ? s.delete(id) : s.add(id)
  open.value = s
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Reports & exports" subtitle="Excel-ready CSV exports and a printable category-wise draw list." />

    <div class="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-end">
      <label class="sm:w-80"><span class="p-label">Championship</span>
        <select v-model="eventId" class="p-select" :disabled="eventsLoading"><option value="" disabled>Choose a championship</option><option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option></select>
      </label>
    </div>

    <EmptyState v-if="!eventsLoading && !events.length" icon="trophy" title="No championships" message="Create a championship to see reports." />

    <template v-else-if="eventId">
      <section class="mb-8 grid gap-4 print:hidden sm:grid-cols-2 xl:grid-cols-4">
        <button v-for="x in exportsList" :key="x.kind" type="button" class="p-card p-card-hover group p-5 text-left" @click="csv(x.kind)">
          <AppIcon name="download" class="h-6 w-6 text-ember" />
          <p class="mt-3 font-semibold text-bone group-hover:text-ember">{{ x.label }} (CSV)</p>
          <p class="mt-1 text-sm text-smoke">{{ x.hint }}</p>
        </button>
      </section>

      <section>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-display text-2xl uppercase tracking-wide text-bone">Category-wise report<span v-if="report" class="text-smoke"> · {{ report.event.name }}</span></h2>
          <div class="flex items-center gap-3 print:hidden">
            <label class="flex items-center gap-2 text-sm text-ash"><input v-model="approvedOnly" type="checkbox" class="p-check" /> Approved only</label>
            <BaseButton size="sm" variant="outline" @click="open = new Set(report?.categories.map((c) => c.id))">Expand all</BaseButton>
            <BaseButton size="sm" variant="outline" icon="file" @click="printReport">Print</BaseButton>
          </div>
        </div>

        <div v-if="loading" class="space-y-3"><div v-for="n in 4" :key="n" class="skeleton h-14" /></div>
        <div v-else-if="report" class="space-y-8">
          <div v-for="[disc, cats] in groups" :key="disc">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-ember">{{ DISCIPLINE_LABELS[disc] }}</h3>
            <div class="space-y-2">
              <article v-for="c in cats" :key="c.id" class="p-card break-inside-avoid">
                <button type="button" class="flex w-full items-center justify-between gap-3 px-5 py-3 text-left" :aria-expanded="open.has(c.id) ? 'true' : 'false'" @click="toggle(c.id)">
                  <span class="font-semibold text-bone">{{ c.name }}</span>
                  <span class="flex items-center gap-3 text-sm"><span :class="c.entry_count ? 'text-bone' : 'text-smoke'">{{ c.entry_count }} entr{{ c.entry_count === 1 ? 'y' : 'ies' }}</span><AppIcon name="chevronDown" class="h-4 w-4 text-smoke transition-transform print:hidden" :class="open.has(c.id) ? 'rotate-180' : ''" /></span>
                </button>
                <div v-if="open.has(c.id) && c.entries.length" class="border-t border-line px-5 py-4">
                  <div v-for="[w, list] in byWeight(c.entries)" :key="w" class="mb-4 last:mb-0">
                    <p v-if="w !== 'All'" class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">{{ w }} · {{ list.length }}</p>
                    <div class="overflow-x-auto">
                      <table class="p-table min-w-[36rem]">
                        <thead><tr><th>#</th><th>Athlete(s)</th><th>Team / club</th><th>Age</th><th>Belt</th><th>Weight</th><th>Status</th></tr></thead>
                        <tbody>
                          <tr v-for="(e, i) in list" :key="e.id">
                            <td>{{ i + 1 }}</td>
                            <td class="text-bone">{{ e.athletes.map((a) => a.full_name).join(', ') }}<span class="block font-mono text-xs text-smoke">{{ e.code }}</span></td>
                            <td>{{ e.team_name }}<span class="block text-xs text-smoke">{{ e.club_name }}</span></td>
                            <td>{{ e.athletes.map((a) => a.age).join(' / ') }}</td>
                            <td>{{ e.athletes.map((a) => a.belt).join(' / ') }}</td>
                            <td>{{ e.athletes.map((a) => (a.weight_kg ? `${a.weight_kg}` : '—')).join(' / ') }}</td>
                            <td><StatusBadge :value="e.status" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <p v-else-if="open.has(c.id)" class="border-t border-line px-5 py-3 text-sm text-smoke">No entries.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
