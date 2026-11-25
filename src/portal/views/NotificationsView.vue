<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import Pager from '../components/Pager.vue'
import { http } from '../lib/api.js'
import { fmtDateTime, relativeTime } from '../lib/format.js'
import { setUnread } from '../lib/session.js'
import { toast } from '../lib/ui.js'

const router = useRouter()
const page = ref(1)
const unreadOnly = ref(false)
const { data, loading, error, reload } = useAsync(
  async ({ signal }) => {
    const d = await http.get('/notifications', { page: page.value, unread: unreadOnly.value ? 1 : '' }, { signal })
    setUnread(d.unread)
    return d
  },
  { watch: () => [page.value, unreadOnly.value] },
)

const icon = { success: 'check', warning: 'alert', announcement: 'bell', info: 'info' }
const tone = { success: 'text-success', warning: 'text-[#f2c94c]', announcement: 'text-ember', info: 'text-ember' }

async function open(n) {
  if (!n.read_at) {
    const r = await http.post(`/notifications/${n.id}/read`).catch(() => null)
    n.read_at = new Date().toISOString()
    if (r) setUnread(r.unread)
  }
  if (n.link) router.push(n.link)
}
async function readAll() {
  try {
    await http.post('/notifications/read-all')
    setUnread(0)
    reload()
  } catch (err) {
    toast.error(err)
  }
}
async function remove(n) {
  try {
    await http.del(`/notifications/${n.id}`)
    reload()
  } catch (err) {
    toast.error(err)
  }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Inbox" title="Notifications" subtitle="Submission receipts, review decisions, payment confirmations and championship announcements.">
      <template #actions>
        <label class="flex items-center gap-2 text-sm text-ash"><input v-model="unreadOnly" type="checkbox" class="p-check" /> Unread only</label>
        <BaseButton size="sm" variant="outline" icon="check" :disabled="!data?.unread" @click="readAll">Mark all read</BaseButton>
      </template>
    </PageHeader>

    <AsyncState :loading="loading && !data" :error="error" :empty="!data?.items.length" @retry="reload">
      <template #empty><EmptyState icon="bell" :title="unreadOnly ? 'All caught up' : 'No notifications yet'" message="You’ll be notified here about every change to your entries." /></template>
      <ul class="p-card divide-y divide-line">
        <li v-for="n in data.items" :key="n.id" class="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]" :class="n.read_at ? '' : 'bg-ember/[0.04]'">
          <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line" :class="tone[n.kind] || 'text-ember'"><AppIcon :name="icon[n.kind] || 'info'" class="h-4 w-4" /></span>
          <button type="button" class="min-w-0 flex-1 text-left" @click="open(n)">
            <p class="flex items-center gap-2 font-semibold text-bone"><span v-if="!n.read_at" class="h-2 w-2 shrink-0 rounded-full bg-ember" aria-label="Unread" />{{ n.title }}</p>
            <p v-if="n.body" class="mt-1 text-sm text-ash">{{ n.body }}</p>
            <p class="mt-1 text-xs text-smoke" :title="fmtDateTime(n.created_at)">{{ relativeTime(n.created_at) }}</p>
          </button>
          <button type="button" class="p-icon-btn is-danger opacity-60 group-hover:opacity-100" aria-label="Delete notification" @click="remove(n)"><AppIcon name="close" class="h-4 w-4" /></button>
        </li>
      </ul>
      <Pager v-model:page="page" :pages="data.pages" :total="data.total" :page-size="data.pageSize" />
    </AsyncState>
  </div>
</template>
