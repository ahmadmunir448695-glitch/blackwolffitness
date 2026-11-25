<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import TeamFormModal from '../components/TeamFormModal.vue'
import { fileUrl, http } from '../lib/api.js'
import { isManager, session } from '../lib/session.js'
import { fmtDate } from '../lib/format.js'

const { data, loading, error, reload } = useAsync(({ signal }) => http.get('/teams', null, { signal }).then((d) => d.items), { initial: [] })
const creating = ref(false)

function created() {
  creating.value = false
  reload()
}
</script>

<template>
  <div>
    <PageHeader eyebrow="My Team" title="Teams" :subtitle="`Teams of ${session.user?.club?.name || 'your club'}. Each team has its own ID, athletes and coaches.`">
      <template v-if="isManager" #actions>
        <BaseButton icon="plus" size="sm" @click="creating = true">Create new team</BaseButton>
      </template>
    </PageHeader>

    <AsyncState :loading="loading" :error="error" :empty="!data.length" error-title="Teams could not load" @retry="reload">
      <template #loading><div class="grid gap-5 md:grid-cols-2"><div v-for="n in 2" :key="n" class="skeleton h-56" /></div></template>
      <template #empty>
        <EmptyState icon="users" title="No teams yet" :message="isManager ? 'Create a team to start adding athletes and registering for championships.' : 'Your club manager has not created a team yet.'">
          <BaseButton v-if="isManager" icon="plus" size="sm" @click="creating = true">Create new team</BaseButton>
        </EmptyState>
      </template>

      <div class="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        <RouterLink v-for="t in data" :key="t.id" :to="`/portal/team/${t.id}`" class="p-card p-card-hover group flex flex-col p-6">
          <div class="flex items-start gap-4">
            <span class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-line bg-iron">
              <img v-if="t.logo_url" :src="fileUrl(t.logo_url)" alt="" class="h-full w-full object-cover" />
              <AppIcon v-else name="shield" class="h-8 w-8 text-ember" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ember">{{ t.code }}</p>
              <h2 class="truncate font-display text-[1.7rem] uppercase leading-tight tracking-wide text-bone group-hover:text-ember">{{ t.name }}</h2>
              <p class="text-sm text-smoke">{{ t.club_name }} · {{ t.city }}, {{ t.country }}</p>
            </div>
            <span class="p-badge" :class="t.status === 'active' ? 'tone-success' : 'tone-muted'">{{ t.status }}</span>
          </div>
          <dl class="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            <div><dt class="text-xs uppercase tracking-wider text-smoke">Athletes</dt><dd class="font-display text-3xl font-bold text-bone">{{ t.total_athletes }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wider text-smoke">Coaches</dt><dd class="font-display text-3xl font-bold text-bone">{{ t.total_coaches }}</dd></div>
            <div><dt class="text-xs uppercase tracking-wider text-smoke">Entries</dt><dd class="font-display text-3xl font-bold text-bone">{{ t.active_entries }}</dd></div>
          </dl>
          <p class="mt-4 text-sm text-ash">Head coach: <span class="text-bone">{{ t.head_coach_name || 'Not set' }}</span></p>
          <p class="mt-1 text-xs text-smoke">Created {{ fmtDate(t.created_at) }}</p>
        </RouterLink>
      </div>
    </AsyncState>

    <TeamFormModal :open="creating" @close="creating = false" @saved="created" />
  </div>
</template>
