<script setup>
/**
 * Add or edit an athlete, with an optional photo. Used by the Athletes page,
 * the team page and the registration wizard.
 */
import { onMounted, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import Modal from './Modal.vue'
import FileDrop from './FileDrop.vue'
import { http } from '../lib/api.js'
import { applyFieldErrors, loadMeta, toast } from '../lib/ui.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  athlete: { type: Object, default: null },
  teamId: { type: [Number, String], default: null },
})
const emit = defineEmits(['close', 'saved'])

const belts = ref([])
const teams = ref([])
const coaches = ref([])
onMounted(async () => {
  try {
    const [meta, t, c] = await Promise.all([loadMeta(), http.get('/teams'), http.get('/coaches')])
    belts.value = meta.belts
    teams.value = t.items
    coaches.value = c.items
  } catch (err) {
    toast.error(err)
  }
})

const KEYS = ['full_name', 'father_name', 'dob', 'gender', 'nationality', 'id_number', 'belt', 'weight_kg', 'height_cm', 'team_id', 'coach_id']
const blank = () => ({ full_name: '', father_name: '', dob: '', gender: '', nationality: 'Pakistani', id_number: '', belt: '', weight_kg: '', height_cm: '', team_id: props.teamId ?? '', coach_id: '' })
const form = reactive(blank())
const errors = reactive(Object.fromEntries(KEYS.map((k) => [k, ''])))
const photo = ref(null)
const busy = ref(false)
const today = new Date().toISOString().slice(0, 10)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, blank())
    if (props.athlete) for (const k of KEYS) form[k] = props.athlete[k] ?? ''
    photo.value = null
    applyFieldErrors(errors, null)
  },
)

async function save() {
  busy.value = true
  try {
    const body = Object.fromEntries(KEYS.map((k) => [k, form[k] === '' ? null : form[k]]))
    const res = props.athlete ? await http.patch(`/athletes/${props.athlete.id}`, body) : await http.post('/athletes', body)
    let athlete = res.athlete
    if (photo.value) {
      try {
        athlete = (await http.upload(`/athletes/${athlete.id}/photo`, photo.value)).athlete
      } catch (err) {
        toast.error(`Athlete saved, but the photo failed: ${err.message}`)
      }
    }
    toast.success(props.athlete ? 'Athlete updated.' : `${athlete.full_name} added (${athlete.code}).`)
    emit('saved', athlete)
  } catch (err) {
    if (!applyFieldErrors(errors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Modal :open="open" :title="athlete ? 'Edit athlete' : 'Add athlete'" :subtitle="athlete ? athlete.code : 'Details must match the athlete’s ID document.'" size="lg" @close="emit('close')">
    <form id="athlete-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <FormField id="ath-full_name" label="Full name" :error="errors.full_name">
        <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.full_name" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
      </FormField>
      <FormField id="ath-father_name" label="Father name" :error="errors.father_name" optional>
        <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.father_name" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
      </FormField>
      <FormField id="ath-dob" label="Date of birth" :error="errors.dob">
        <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.dob" type="date" :max="today" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
      </FormField>
      <FormField id="ath-gender" label="Gender" :error="errors.gender">
        <template #default="{ id, describedby, invalid }">
          <select :id="id" v-model="form.gender" class="p-select" :aria-describedby="describedby" :aria-invalid="invalid">
            <option value="" disabled>Choose</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </template>
      </FormField>
      <FormField id="ath-nationality" label="Nationality" :error="errors.nationality">
        <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.nationality" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
      </FormField>
      <FormField id="ath-id_number" label="Passport / ID number" :error="errors.id_number" optional hint="CNIC, B-Form or passport number.">
        <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.id_number" class="p-input" autocomplete="off" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
      </FormField>
      <FormField id="ath-belt" label="Belt / Dan grade" :error="errors.belt">
        <template #default="{ id, describedby, invalid }">
          <select :id="id" v-model="form.belt" class="p-select" :aria-describedby="describedby" :aria-invalid="invalid">
            <option value="" disabled>Choose</option>
            <option v-for="b in belts" :key="b" :value="b">{{ b }}</option>
          </select>
        </template>
      </FormField>
      <div class="grid grid-cols-2 gap-4">
        <FormField id="ath-weight_kg" label="Weight (kg)" :error="errors.weight_kg" hint="Needed for kyorugi.">
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.weight_kg" type="number" step="0.1" min="10" max="200" inputmode="decimal" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
        <FormField id="ath-height_cm" label="Height (cm)" :error="errors.height_cm" optional>
          <template #default="{ id, describedby, invalid }"><input :id="id" v-model="form.height_cm" type="number" step="1" min="50" max="250" inputmode="numeric" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" /></template>
        </FormField>
      </div>
      <FormField id="ath-team_id" label="Team" :error="errors.team_id" optional>
        <template #default="{ id, describedby, invalid }">
          <select :id="id" v-model="form.team_id" class="p-select" :aria-describedby="describedby" :aria-invalid="invalid">
            <option value="">No team</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </template>
      </FormField>
      <FormField id="ath-coach_id" label="Coach" :error="errors.coach_id" optional>
        <template #default="{ id, describedby, invalid }">
          <select :id="id" v-model="form.coach_id" class="p-select" :aria-describedby="describedby" :aria-invalid="invalid">
            <option value="">No coach</option>
            <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.full_name }}</option>
          </select>
        </template>
      </FormField>
      <div class="sm:col-span-2">
        <p class="p-label">Athlete photo <span class="font-normal text-smoke">({{ athlete?.has_photo ? 'replace current photo' : 'optional now, required by most events' }})</span></p>
        <FileDrop accept="image/jpeg,image/png,image/webp" label="Choose a passport-style photo" compact @select="photo = $event" />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="outline" size="sm" @click="emit('close')">Cancel</BaseButton>
      <BaseButton type="submit" form="athlete-form" size="sm" :disabled="busy">{{ busy ? 'Saving…' : athlete ? 'Save changes' : 'Add athlete' }}</BaseButton>
    </template>
  </Modal>
</template>
