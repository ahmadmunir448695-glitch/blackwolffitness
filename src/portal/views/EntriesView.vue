<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import Pager from '../components/Pager.vue'
import SearchBox from '../components/SearchBox.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { download, http } from '../lib/api.js'
import { ENTRY_STATUS, PAYMENT_STATUS, fmtDate, fmtMoney } from '../lib/format.js'
import { isClubUser } from '../lib/session.js'
import { toast } from '../lib/ui.js'

const route = useRoute()
const router = useRouter()
const filters = reactive({
  q: String(route.query.q ?? ''),
  eventId: String(route.query.eventId ?? ''),
  status: String(route.query.status ?? ''),
  payment: String(route.query.payment ?? ''),
  page: Number(route.query.page) || 1,
})
const sort = ref({ key: 'created', dir: 'desc' })
const events = ref([])
http.get('/events').then((d) => (events.value = d.items)).catch(() => {})

const { data, loading, error, reload } = useAsync(
  ({ signal }) => http.get('/registrations', { ...filters, sort: sort.value.key, dir: sort.value.dir, pageSize: 25 }, { signal }),
  { watch: () => [filters.q, filters.eventId, filters.status, filters.payment, filters.page, sort.value] },
)
watch(() => [filters.q, filters.eventId, filters.status, filters.payment], () => (filters.page = 1))
watch(filters, () => router.replace({ query: Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && !(k === 'page' && v === 1))) }))

const columns = [
  { key: 'code', label: 'Registration ID', sortable: true },
  { key: 'athlete', label: 'Athlete', sortable: true },
  { key: 'event', label: 'Championship', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'team', label: 'Team', sortable: true },
  { key: 'created', label: 'Registered', sortable: true },
  { key: 'payment', label: 'Payment', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'pdf', label: '', align: 'right' },
]

const pdf = (row) => download(`/registrations/${row.id}/confirmation.pdf`, null, `registration-${row.code}.pdf`).catch(toast.error)
</script>

<template>
  <div>
    <PageHeader eyebrow="My Entries" title="Entries" subtitle="Every registration with its review and payment status. Open an entry to edit it, answer a correction or report a payment.">
      <template v-if="isClubUser" #actions><BaseButton to="/portal/register" size="sm" icon="plus">New registration</BaseButton></template>
    </PageHeader>

    <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap">
      <SearchBox v-model="filters.q" placeholder="Athlete, ID, category, team" label="Search entries" />
      <label class="lg:w-60"><span class="sr-only">Championship</span>
        <select v-model="filters.eventId" class="p-select"><option value="">All championships</option><option v-for="e in events" :key="e.id" :value="String(e.id)">{{ e.name }}</option></select>
      </label>
      <label class="lg:w-52"><span class="sr-only">Status</span>
        <select v-model="filters.status" class="p-select"><option value="">All statuses</option><option v-for="(s, k) in ENTRY_STATUS" :key="k" :value="k">{{ s.label }}</option></select>
      </label>
      <label class="lg:w-48"><span class="sr-only">Payment</span>
        <select v-model="filters.payment" class="p-select"><option value="">Any payment</option><option v-for="k in ['unpaid', 'pending', 'paid', 'waived', 'refunded']" :key="k" :value="k">{{ PAYMENT_STATUS[k].label }}</option></select>
      </label>
    </div>

    <p v-if="error" role="alert" class="mb-4 border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">{{ error.message }} <button type="button" class="ml-2 underline" @click="reload">Try again</button></p>

    <DataTable :columns="columns" :rows="data?.items ?? []" :sort="sort" :loading="loading" clickable caption="Championship entries" @sort="sort = $event" @row-click="router.push(`/portal/entries/${$event.id}`)">
      <template #cell-code="{ row }"><span class="font-mono font-semibold text-bone">{{ row.code }}</span></template>
      <template #cell-athlete="{ row }"><span class="font-semibold text-bone">{{ row.athlete_names }}</span></template>
      <template #cell-event="{ row }">{{ row.event_name }}</template>
      <template #cell-category="{ row }">{{ row.category_name }}<span v-if="row.weight_name" class="block text-xs text-smoke">{{ row.weight_name }}</span></template>
      <template #cell-team="{ row }">{{ row.team_name }}</template>
      <template #cell-created="{ row }">{{ fmtDate(row.created_at) }}</template>
      <template #cell-payment="{ row }"><StatusBadge :value="row.payment_status" kind="payment" /><span class="mt-1 block text-xs text-smoke">{{ fmtMoney(row.fee_amount, row.currency) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #cell-pdf="{ row }">
        <button type="button" class="p-icon-btn" :aria-label="`Download confirmation for ${row.code}`" title="Confirmation PDF" @click.stop="pdf(row)"><AppIcon name="download" class="h-4 w-4" /></button>
      </template>
      <template #empty>
        <div class="px-6 py-10 text-center">
          <p class="text-sm text-smoke">{{ filters.q || filters.status || filters.eventId || filters.payment ? 'No entries match these filters.' : 'No entries yet.' }}</p>
          <BaseButton v-if="isClubUser && !filters.q" class="mt-4" to="/portal/register" size="sm" icon="plus">Register athletes</BaseButton>
        </div>
      </template>
    </DataTable>
    <Pager v-if="data" v-model:page="filters.page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
  </div>
</template>
