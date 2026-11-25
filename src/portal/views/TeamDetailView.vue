<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import FileDrop from '../components/FileDrop.vue'
import TeamFormModal from '../components/TeamFormModal.vue'
import AthleteFormModal from '../components/AthleteFormModal.vue'
import AuthImage from '../components/AuthImage.vue'
import { fileUrl, http } from '../lib/api.js'
import { fmtDate, humanize } from '../lib/format.js'
import { isManager } from '../lib/session.js'
import { confirmDialog, toast } from '../lib/ui.js'

const route = useRoute()
const router = useRouter()
const { data, loading, error, reload } = useAsync(({ signal }) => http.get(`/teams/${route.params.id}`, null, { signal }), { watch: () => route.params.id })

const editing = ref(false)
const athleteModal = ref(false)
const editAthlete = ref(null)
const logoBusy = ref(false)

const columns = [
  { key: 'full_name', label: 'Athlete' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'belt', label: 'Belt / Dan' },
  { key: 'weight_kg', label: 'Weight' },
  { key: 'coach_name', label: 'Coach' },
  { key: 'actions', label: '', align: 'right' },
]

async function uploadLogo(file) {
  logoBusy.value = true
  try {
    await http.upload(`/teams/${route.params.id}/logo`, file)
    toast.success('Team logo updated.')
    reload()
  } catch (err) {
    toast.error(err)
  } finally {
    logoBusy.value = false
  }
}

function openAthlete(a = null) {
  editAthlete.value = a
  athleteModal.value = true
}

async function removeFromTeam(a) {
  if (!(await confirmDialog({ title: 'Remove from team?', message: `${a.full_name} stays in your club’s athlete list and can join another team. Existing entries are not changed.`, confirmLabel: 'Remove from team' }))) return
  try {
    await http.patch(`/athletes/${a.id}`, { team_id: null })
    toast.success(`${a.full_name} removed from the team.`)
    reload()
  } catch (err) {
    toast.error(err)
  }
}

async function deleteTeam() {
  if (!(await confirmDialog({ title: 'Delete this team?', message: 'Athletes and coaches stay in your club. A team with championship entries cannot be deleted; set it to inactive instead.', confirmLabel: 'Delete team', danger: true }))) return
  try {
    await http.del(`/teams/${route.params.id}`)
    toast.success('Team deleted.')
    router.replace('/portal/team')
  } catch (err) {
    toast.error(err)
  }
}

function saved() {
  editing.value = false
  athleteModal.value = false
  reload()
}
</script>

<template>
  <AsyncState :loading="loading" :error="error" error-title="This team could not load" @retry="reload">
    <template #loading><div class="skeleton mb-6 h-48" /><div class="skeleton h-80" /></template>
    <div v-if="data">
      <PageHeader :eyebrow="data.team.code" :title="data.team.name" :subtitle="`${data.team.club_name} · ${data.team.city}, ${data.team.country}`" back="/portal/team" back-label="All teams">
        <template #actions>
          <BaseButton size="sm" icon="plus" @click="openAthlete()">Add athlete</BaseButton>
          <BaseButton :to="`/portal/register?team=${data.team.id}`" size="sm" variant="outline" icon="clipboard">Register team</BaseButton>
          <BaseButton v-if="isManager" size="sm" variant="outline" icon="edit" @click="editing = true">Edit team</BaseButton>
        </template>
      </PageHeader>

      <div class="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside class="space-y-6">
          <section class="p-card p-5">
            <div class="mb-5 flex items-center gap-4">
              <span class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-line bg-iron">
                <img v-if="data.team.logo_url" :src="fileUrl(data.team.logo_url)" :alt="`${data.team.name} logo`" class="h-full w-full object-cover" />
                <AppIcon v-else name="shield" class="h-9 w-9 text-ember" />
              </span>
              <div>
                <span class="p-badge" :class="data.team.status === 'active' ? 'tone-success' : 'tone-muted'">{{ data.team.status }}</span>
                <p class="mt-2 text-xs text-smoke">Created {{ fmtDate(data.team.created_at) }}</p>
              </div>
            </div>
            <FileDrop v-if="isManager" accept="image/jpeg,image/png,image/webp" label="Upload team logo" :busy="logoBusy" compact @select="uploadLogo" />
            <dl class="p-dl mt-5">
              <dt>Team ID</dt><dd class="font-mono">{{ data.team.code }}</dd>
              <dt>Club / academy</dt><dd>{{ data.team.club_name }}</dd>
              <dt>Head coach</dt><dd>{{ data.team.head_coach_name || '—' }}</dd>
              <dt>Coach phone</dt><dd>{{ data.team.coach_phone || '—' }}</dd>
              <dt>Coach email</dt><dd>{{ data.team.coach_email || '—' }}</dd>
              <dt>Total athletes</dt><dd>{{ data.team.total_athletes }}</dd>
              <dt>Active entries</dt><dd>{{ data.team.active_entries }}</dd>
            </dl>
          </section>

          <section class="p-card">
            <div class="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 class="font-display text-xl uppercase tracking-wide text-bone">Coaches</h2>
              <RouterLink to="/portal/coaches" class="p-link text-sm">Manage</RouterLink>
            </div>
            <ul class="divide-y divide-line">
              <li v-for="c in data.coaches" :key="c.id" class="px-5 py-3">
                <p class="font-semibold text-bone">{{ c.full_name }} <span class="text-xs font-normal uppercase tracking-wider text-ember">{{ humanize(c.role) }}</span></p>
                <p class="text-sm text-smoke">{{ [c.dan_grade, c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details' }}</p>
              </li>
              <li v-if="!data.coaches.length" class="px-5 py-4 text-sm text-smoke">No coaches assigned. Assign one from the Coaches page.</li>
            </ul>
          </section>

          <button v-if="isManager" type="button" class="flex items-center gap-2 text-sm text-smoke hover:text-danger" @click="deleteTeam">
            <AppIcon name="trash" class="h-4 w-4" /> Delete team
          </button>
        </aside>

        <section>
          <h2 class="mb-3 font-display text-2xl uppercase tracking-wide text-bone">Team members <span class="text-smoke">({{ data.athletes.length }})</span></h2>
          <DataTable :columns="columns" :rows="data.athletes" caption="Team members">
            <template #cell-full_name="{ row }">
              <RouterLink :to="`/portal/athletes/${row.id}`" class="flex items-center gap-3">
                <AuthImage :src="row.has_photo ? `/athletes/${row.id}/photo` : ''" :name="row.full_name" size-class="h-10 w-10" />
                <span><span class="block font-semibold text-bone hover:text-ember">{{ row.full_name }}</span><span class="text-xs text-smoke">{{ row.code }}</span></span>
              </RouterLink>
            </template>
            <template #cell-dob="{ row }">{{ fmtDate(row.dob) }}</template>
            <template #cell-gender="{ row }">{{ humanize(row.gender) }}</template>
            <template #cell-weight_kg="{ row }">{{ row.weight_kg ? `${row.weight_kg} kg` : '—' }}</template>
            <template #cell-actions="{ row }">
              <div class="flex justify-end gap-1.5">
                <button type="button" class="p-icon-btn" :aria-label="`Edit ${row.full_name}`" @click="openAthlete(row)"><AppIcon name="edit" class="h-4 w-4" /></button>
                <button type="button" class="p-icon-btn is-danger" :aria-label="`Remove ${row.full_name} from team`" @click="removeFromTeam(row)"><AppIcon name="close" class="h-4 w-4" /></button>
              </div>
            </template>
            <template #empty>
              <div class="px-6 py-10 text-center">
                <p class="text-sm text-smoke">No athletes in this team yet.</p>
                <BaseButton class="mt-4" size="sm" icon="plus" @click="openAthlete()">Add athlete</BaseButton>
              </div>
            </template>
          </DataTable>
        </section>
      </div>

      <TeamFormModal :open="editing" :team="data.team" @close="editing = false" @saved="saved" />
      <AthleteFormModal :open="athleteModal" :athlete="editAthlete" :team-id="data.team.id" @close="athleteModal = false" @saved="saved" />
    </div>
  </AsyncState>
</template>
