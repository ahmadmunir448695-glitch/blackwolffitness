<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import EventDetailsForm from './event/EventDetailsForm.vue'
import EventStatusTab from './event/EventStatusTab.vue'
import EventFilesTab from './event/EventFilesTab.vue'
import AgeGroupsTab from './event/AgeGroupsTab.vue'
import WeightsTab from './event/WeightsTab.vue'
import BeltGroupsTab from './event/BeltGroupsTab.vue'
import CategoriesTab from './event/CategoriesTab.vue'
import AnnouncementsTab from './event/AnnouncementsTab.vue'
import CopySetupTab from './event/CopySetupTab.vue'
import OrganizersTab from './event/OrganizersTab.vue'
import { http } from '../../lib/api.js'
import { fmtRange } from '../../lib/format.js'
import { isSuperAdmin } from '../../lib/session.js'
import { loadMeta, toast } from '../../lib/ui.js'

const route = useRoute()
const router = useRouter()
const isNew = computed(() => route.name === 'admin-event-new' || route.params.id === 'new')
const eventId = computed(() => Number(route.params.id))

const config = ref(null) // { event, age_divisions, weight_divisions, belt_divisions, categories, announcements }
const organizers = ref([])
const meta = ref({ belts: [], disciplines: [] })
const loading = ref(!isNew.value)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get(`/admin/events/${eventId.value}`)
    organizers.value = res.organizers || []
    setConfig(res)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function setConfig(res) {
  const { event, age_divisions, weight_divisions, belt_divisions, categories, announcements } = res
  config.value = { event, age_divisions, weight_divisions, belt_divisions, categories, announcements }
}

onMounted(() => {
  loadMeta()
    .then((m) => (meta.value = m))
    .catch((err) => toast.error(err))
  if (!isNew.value) load()
})

async function create(payload) {
  const res = await http.post('/admin/events', payload)
  toast.success('Championship created. Now add age groups, weight classes and categories.')
  router.replace({ path: `/portal/admin/events/${res.event.id}`, query: { tab: 'ages' } })
}

async function saveDetails(payload) {
  setConfig(await http.patch(`/admin/events/${eventId.value}`, payload))
  toast.success('Details saved.')
}

// ---- Tabs ---------------------------------------------------------------------
const tabs = computed(() => {
  const c = config.value
  const list = [
    { key: 'details', label: 'Details' },
    { key: 'status', label: 'Status & publishing' },
    { key: 'files', label: 'Files' },
    { key: 'ages', label: 'Age groups', count: c?.age_divisions.length },
    { key: 'weights', label: 'Weight categories', count: c?.weight_divisions.length },
    { key: 'belts', label: 'Belt groups', count: c?.belt_divisions.length },
    { key: 'categories', label: 'Categories', count: c?.categories.length },
    { key: 'announcements', label: 'Announcements', count: c?.announcements.length },
    { key: 'copy', label: 'Copy setup' },
  ]
  if (isSuperAdmin.value) list.push({ key: 'organizers', label: 'Organizers', count: organizers.value.length })
  return list
})
const tab = computed(() => (tabs.value.some((t) => t.key === route.query.tab) ? route.query.tab : 'details'))
const tabRefs = ref({})

function selectTab(key, focus = false) {
  router.replace({ query: { ...route.query, tab: key === 'details' ? undefined : key } })
  if (focus) nextTick(() => tabRefs.value[key]?.focus())
}

function onTabKey(e) {
  const keys = tabs.value.map((t) => t.key)
  const i = keys.indexOf(tab.value)
  let next = null
  if (e.key === 'ArrowRight') next = keys[(i + 1) % keys.length]
  else if (e.key === 'ArrowLeft') next = keys[(i - 1 + keys.length) % keys.length]
  else if (e.key === 'Home') next = keys[0]
  else if (e.key === 'End') next = keys[keys.length - 1]
  if (next) {
    e.preventDefault()
    selectTab(next, true)
  }
}
</script>

<template>
  <div>
    <!-- Create -->
    <template v-if="isNew">
      <PageHeader back="/portal/admin/events" back-label="Championships" eyebrow="New championship" title="Create championship" subtitle="Start with the basics. After saving you can add age groups, weight classes, categories, files and announcements." />
      <EventDetailsForm :save="create" submit-label="Create championship">
        <template #actions>
          <BaseButton variant="outline" size="sm" to="/portal/admin/events">Cancel</BaseButton>
        </template>
      </EventDetailsForm>
    </template>

    <!-- Edit -->
    <template v-else>
      <div v-if="loading && !config" aria-busy="true">
        <div class="skeleton mb-3 h-5 w-32" />
        <div class="skeleton mb-8 h-12 w-2/3" />
        <div class="skeleton mb-6 h-12" />
        <div class="skeleton h-96" />
      </div>

      <EmptyState v-else-if="error" icon="alert" title="Could not load the championship" :message="error">
        <BaseButton size="sm" variant="outline" icon="refresh" @click="load">Try again</BaseButton>
        <BaseButton size="sm" variant="outline" to="/portal/admin/events">All championships</BaseButton>
      </EmptyState>

      <template v-else-if="config">
        <PageHeader back="/portal/admin/events" back-label="Championships" eyebrow="Edit championship" :title="config.event.name">
          <template #meta>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-ash">
              <StatusBadge :value="config.event.status" kind="event" />
              <span class="p-badge" :class="config.event.published ? 'tone-success' : 'tone-muted'">{{ config.event.published ? 'Published' : 'Draft' }}</span>
              <span>{{ fmtRange(config.event.start_date, config.event.end_date) }}</span>
              <span v-if="config.event.city">· {{ config.event.city }}</span>
            </div>
          </template>
          <template #actions>
            <BaseButton v-if="config.event.published" variant="outline" size="sm" icon="eye" :to="`/portal/events/${config.event.slug}`">Public page</BaseButton>
            <BaseButton variant="outline" size="sm" icon="clipboard" :to="{ path: '/portal/admin/registrations', query: { eventId: config.event.id } }">Entries</BaseButton>
          </template>
        </PageHeader>

        <div class="p-tabs mb-6" role="tablist" aria-label="Championship setup" @keydown="onTabKey">
          <button
            v-for="t in tabs"
            :id="`tab-${t.key}`"
            :key="t.key"
            :ref="(el) => (tabRefs[t.key] = el)"
            type="button"
            role="tab"
            class="p-tab"
            :aria-selected="tab === t.key ? 'true' : 'false'"
            :aria-controls="`panel-${t.key}`"
            :tabindex="tab === t.key ? 0 : -1"
            @click="selectTab(t.key)"
          >
            {{ t.label }}<span v-if="t.count !== undefined" class="ml-1.5 text-xs text-smoke">{{ t.count }}</span>
          </button>
        </div>

        <div :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`" tabindex="-1" class="outline-none">
          <EventDetailsForm v-show="tab === 'details'" :event="config.event" :save="saveDetails" />
          <EventStatusTab v-if="tab === 'status'" :config="config" @update="setConfig" />
          <EventFilesTab v-else-if="tab === 'files'" :config="config" @update="setConfig" />
          <AgeGroupsTab v-else-if="tab === 'ages'" :config="config" @update="setConfig" />
          <WeightsTab v-else-if="tab === 'weights'" :config="config" @update="setConfig" />
          <BeltGroupsTab v-else-if="tab === 'belts'" :config="config" :belts="meta.belts || []" @update="setConfig" />
          <CategoriesTab v-else-if="tab === 'categories'" :config="config" :disciplines="meta.disciplines || []" @update="setConfig" />
          <AnnouncementsTab v-else-if="tab === 'announcements'" :config="config" @update="setConfig" />
          <CopySetupTab v-else-if="tab === 'copy'" :config="config" @update="setConfig" />
          <OrganizersTab v-else-if="tab === 'organizers'" :event-id="config.event.id" :organizers="organizers" @update="(list) => (organizers = list)" />
        </div>

        <p v-if="tab !== 'details' && tab !== 'categories' && !config.categories.length" class="mt-6 text-sm text-smoke">
          Next step: <RouterLink :to="{ query: { tab: 'categories' } }" class="p-link">add competition categories</RouterLink> so clubs can register.
        </p>
      </template>
    </template>
  </div>
</template>
