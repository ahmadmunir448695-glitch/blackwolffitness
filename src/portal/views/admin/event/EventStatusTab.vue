<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '../../../components/StatusBadge.vue'
import { http } from '../../../lib/api.js'
import { EVENT_STATUS, fmtDate } from '../../../lib/format.js'
import { isSuperAdmin } from '../../../lib/session.js'
import { confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])
const router = useRouter()

const event = computed(() => props.config.event)
const busy = ref('')
const override = ref('')
watch(() => event.value.status_override, (v) => (override.value = v || ''), { immediate: true })

const hasCategories = computed(() => props.config.categories.some((c) => c.active))

async function setPublished(published) {
  if (!published && !(await confirmDialog({ title: 'Unpublish championship?', message: 'Clubs will no longer see it or be able to register. Existing entries are kept.', confirmLabel: 'Unpublish' }))) return
  busy.value = 'publish'
  try {
    emit('update', await http.post(`/admin/events/${event.value.id}/publish`, { published }))
    toast.success(published ? 'Championship published.' : 'Championship unpublished.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = ''
  }
}

async function saveStatus() {
  busy.value = 'status'
  try {
    emit('update', await http.post(`/admin/events/${event.value.id}/status`, { status: override.value || null }))
    toast.success(override.value ? `Status set to ${EVENT_STATUS[override.value].label}.` : 'Status follows the dates again.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = ''
  }
}

async function remove() {
  const ok = await confirmDialog({
    title: 'Delete championship?',
    message: `“${event.value.name}” and all of its age groups, weight classes, categories, announcements and files will be permanently deleted. This cannot be undone.`,
    confirmLabel: 'Delete permanently',
    danger: true,
  })
  if (!ok) return
  busy.value = 'delete'
  try {
    await http.del(`/admin/events/${event.value.id}`)
    toast.success('Championship deleted.')
    router.replace('/portal/admin/events')
  } catch (err) {
    toast.error(err)
    busy.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="p-card p-5 sm:p-6" aria-labelledby="pub-title">
      <h2 id="pub-title" class="font-display text-xl uppercase tracking-wide text-bone">Publishing</h2>
      <p class="mt-2 text-sm text-ash">
        A published championship appears on the public events page and clubs can register while registration is open.
        Drafts are only visible to organizers.
      </p>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <span class="p-badge" :class="event.published ? 'tone-success' : 'tone-muted'">{{ event.published ? 'Published' : 'Draft' }}</span>
        <BaseButton v-if="!event.published" size="sm" icon="check" :disabled="busy === 'publish'" @click="setPublished(true)">{{ busy === 'publish' ? 'Publishing…' : 'Publish now' }}</BaseButton>
        <BaseButton v-else variant="outline" size="sm" :disabled="busy === 'publish'" @click="setPublished(false)">{{ busy === 'publish' ? 'Saving…' : 'Unpublish' }}</BaseButton>
      </div>
      <p v-if="!event.published && !hasCategories" class="mt-3 text-sm text-[#f2c94c]">Add at least one active category before publishing.</p>
    </section>

    <section class="p-card p-5 sm:p-6" aria-labelledby="status-title">
      <h2 id="status-title" class="font-display text-xl uppercase tracking-wide text-bone">Status</h2>
      <p class="mt-2 text-sm text-ash">
        On <strong class="text-bone">Automatic</strong>, the status follows the dates: upcoming until registration opens
        ({{ event.registration_opens ? fmtDate(event.registration_opens) : 'immediately' }}), open until the deadline
        ({{ fmtDate(event.registration_deadline) }}), then closed, ongoing and completed. Choose a status to override it, for example to close registration early.
      </p>
      <p class="mt-4 flex items-center gap-2 text-sm text-smoke">Current status: <StatusBadge :value="event.status" kind="event" /></p>
      <form class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="saveStatus">
        <div class="flex-1">
          <label for="status-override" class="p-label">Status</label>
          <select id="status-override" v-model="override" class="p-select">
            <option value="">Automatic (from dates)</option>
            <option v-for="(s, key) in EVENT_STATUS" :key="key" :value="key">{{ s.label }}</option>
          </select>
        </div>
        <BaseButton type="submit" size="sm" :disabled="busy === 'status' || override === (event.status_override || '')">{{ busy === 'status' ? 'Saving…' : 'Apply status' }}</BaseButton>
      </form>
      <p class="mt-2 text-xs text-smoke">Setting “Registration Closed” notifies every club with entries.</p>
    </section>

    <section v-if="isSuperAdmin" class="border border-danger/40 bg-danger/5 p-5 sm:p-6 lg:col-span-2" aria-labelledby="danger-title">
      <h2 id="danger-title" class="font-display text-xl uppercase tracking-wide text-danger">Delete championship</h2>
      <p class="mt-2 text-sm text-ash">Only possible while there are no entries. Championships with entries should be unpublished or closed instead.</p>
      <button
        type="button"
        class="mt-4 inline-flex h-10 items-center gap-2 border border-danger px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-ink disabled:opacity-50"
        :disabled="busy === 'delete'"
        @click="remove"
      >
        {{ busy === 'delete' ? 'Deleting…' : 'Delete championship' }}
      </button>
    </section>
  </div>
</template>
